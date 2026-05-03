import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomWithPlayers } from '@/types'
import { TeamView } from './team-view'
import { ScoreBoard } from './score-board'
import { RoundInput } from './round-input'

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

  // 팀별 플레이어 그룹화
  const teams: Record<number, typeof typedRoom.room_players> = {}
  for (const rp of typedRoom.room_players) {
    if (!teams[rp.team_number]) teams[rp.team_number] = []
    teams[rp.team_number].push(rp)
  }

  const nextRound = typedRoom.round_results.length + 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{typedRoom.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {typedRoom.team_count}팀 구성 · {typedRoom.room_players.length}명 참가
        </p>
      </div>

      <TeamView teams={teams} teamCount={typedRoom.team_count} roomId={typedRoom.id} />

      <ScoreBoard
        rounds={typedRoom.round_results}
        teamCount={typedRoom.team_count}
        scoringRuleKey={typedRoom.scoring_rule ?? 'standard'}
        roomId={typedRoom.id}
      />

      {typedRoom.status !== 'done' && nextRound <= 10 && (
        <RoundInput
          roomId={typedRoom.id}
          roundNumber={nextRound}
          teamCount={typedRoom.team_count}
        />
      )}
    </div>
  )
}
