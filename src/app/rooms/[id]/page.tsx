import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomWithPlayers } from '@/types'
import { SCORING_RULES, ScoringRuleKey, dbRowToScoringRule } from '@/lib/scoring-rules'
import { calcTeamScore } from '@/lib/scoring-rules'
import { TeamView } from './team-view'
import { ScoreBoard } from './score-board'
import { ScoreManager } from './score-manager'
import { FinishRoom } from './finish-room'
import { WinnerBanner } from './winner-banner'
import { RealtimeSync } from './realtime-sync'

export const dynamic = 'force-dynamic'

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: room }, { data: ruleRows }] = await Promise.all([
    supabase
    .from('rooms')
    .select(`
      *,
      room_players (
        *,
        player: players (*)
      ),
      round_results (*)
    `)
    .eq('id', id)
    .order('round_number', { referencedTable: 'round_results', ascending: true })
    .single(),
    supabase.from('scoring_rule_configs').select('*'),
  ])

  if (!room) notFound()

  const allRules = { ...SCORING_RULES }
  for (const row of ruleRows ?? []) {
    allRules[row.key as ScoringRuleKey] = dbRowToScoringRule(row)
  }

  const typedRoom = room as unknown as RoomWithPlayers

  const teams: Record<number, typeof typedRoom.room_players> = {}
  for (const rp of typedRoom.room_players) {
    if (!teams[rp.team_number]) teams[rp.team_number] = []
    teams[rp.team_number].push(rp)
  }

  const rule = allRules[typedRoom.scoring_rule ?? 'standard']

  function isRoundComplete(r: (typeof typedRoom.round_results)[0]) {
    return (
      r.team1_placement != null &&
      r.team2_placement != null &&
      (typedRoom.team_count !== 3 || r.team3_placement != null)
    )
  }

  const completeRounds = typedRoom.round_results.filter(isRoundComplete)

  const totals = [0, 0, 0]
  for (const r of completeRounds) {
    totals[0] += calcTeamScore(rule, r.team1_placement!, r.team1_kills ?? 0)
    totals[1] += calcTeamScore(rule, r.team2_placement!, r.team2_kills ?? 0)
    if (typedRoom.team_count === 3 && r.team3_placement != null) {
      totals[2] += calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
    }
  }

  const isDone = typedRoom.status === 'done'

  return (
    <div className="space-y-8">
      <RealtimeSync roomId={typedRoom.id} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{typedRoom.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {typedRoom.team_count}팀 구성 · {typedRoom.room_players.length}명 참가
            {typedRoom.round_results.length > 0 && ` · ${typedRoom.round_results.length}라운드 완료`}
          </p>
        </div>
        {!isDone && completeRounds.length > 0 && (
          <FinishRoom
            roomId={typedRoom.id}
            teamCount={typedRoom.team_count}
            scores={totals}
          />
        )}
      </div>

      {isDone && typedRoom.winner_team && (
        <WinnerBanner
          winnerTeam={typedRoom.winner_team}
          roomPlayers={typedRoom.room_players}
        />
      )}

      <TeamView teams={teams} teamCount={typedRoom.team_count} roomId={typedRoom.id} isDone={isDone} />

      <ScoreManager
        rounds={typedRoom.round_results}
        teamCount={typedRoom.team_count}
        scoringRuleKey={typedRoom.scoring_rule ?? 'standard'}
        rules={allRules}
        roomId={typedRoom.id}
        isDone={isDone}
      />
    </div>
  )
}
