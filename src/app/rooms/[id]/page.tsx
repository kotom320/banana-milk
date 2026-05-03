import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomWithPlayers } from '@/types'
import { SCORING_RULES } from '@/lib/scoring-rules'
import { calcTeamScore } from '@/lib/scoring-rules'
import { TeamView } from './team-view'
import { ScoreBoard } from './score-board'
import { RoundInput } from './round-input'
import { FinishRoom } from './finish-room'
import { WinnerBanner } from './winner-banner'

export const dynamic = 'force-dynamic'

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: room } = await supabase
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
    .single()

  if (!room) notFound()

  const typedRoom = room as unknown as RoomWithPlayers

  const teams: Record<number, typeof typedRoom.room_players> = {}
  for (const rp of typedRoom.room_players) {
    if (!teams[rp.team_number]) teams[rp.team_number] = []
    teams[rp.team_number].push(rp)
  }

  const rule = SCORING_RULES[typedRoom.scoring_rule ?? 'standard']
  const totals = [0, 0, 0]
  for (const r of typedRoom.round_results) {
    totals[0] += calcTeamScore(rule, r.team1_placement, r.team1_kills)
    totals[1] += calcTeamScore(rule, r.team2_placement, r.team2_kills)
    if (typedRoom.team_count === 3 && r.team3_placement != null) {
      totals[2] += calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
    }
  }

  const nextRound = typedRoom.round_results.length + 1
  const isDone = typedRoom.status === 'done'

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{typedRoom.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {typedRoom.team_count}팀 구성 · {typedRoom.room_players.length}명 참가
            {typedRoom.round_results.length > 0 && ` · ${typedRoom.round_results.length}라운드 완료`}
          </p>
        </div>
        {!isDone && typedRoom.round_results.length > 0 && (
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

      <TeamView teams={teams} teamCount={typedRoom.team_count} roomId={typedRoom.id} />

      <ScoreBoard
        rounds={typedRoom.round_results}
        teamCount={typedRoom.team_count}
        scoringRuleKey={typedRoom.scoring_rule ?? 'standard'}
        roomId={typedRoom.id}
      />

      {!isDone && nextRound <= 10 && (
        <RoundInput
          roomId={typedRoom.id}
          roundNumber={nextRound}
          teamCount={typedRoom.team_count}
        />
      )}
    </div>
  )
}
