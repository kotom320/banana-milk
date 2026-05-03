import { createClient } from '@/lib/supabase/server'
import { RoomWithPlayers } from '@/types'
import { SCORING_RULES, calcTeamScore } from '@/lib/scoring-rules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const TIER_COLORS: Record<number, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

export default async function StatsPage() {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select(`
      *,
      room_players ( *, player: players (*) ),
      round_results (*)
    `)
    .eq('status', 'done')
    .order('created_at', { ascending: false })

  if (!rooms || rooms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">통계</h1>
          <p className="text-muted-foreground text-sm mt-1">종료된 내전의 전적을 분석합니다.</p>
        </div>
        <p className="text-muted-foreground text-center py-16">
          아직 종료된 내전이 없습니다.
        </p>
      </div>
    )
  }

  // 플레이어별 승/패 집계
  const playerStats: Record<string, {
    nickname: string
    tier: number
    wins: number
    losses: number
    total: number
  }> = {}

  for (const room of rooms as unknown as RoomWithPlayers[]) {
    if (!room.winner_team) continue

    const rule = SCORING_RULES[room.scoring_rule ?? 'standard']
    const totals = [0, 0, 0]
    for (const r of room.round_results) {
      totals[0] += calcTeamScore(rule, r.team1_placement, r.team1_kills)
      totals[1] += calcTeamScore(rule, r.team2_placement, r.team2_kills)
      if (room.team_count === 3 && r.team3_placement != null) {
        totals[2] += calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
      }
    }

    for (const rp of room.room_players) {
      const pid = rp.player.id
      if (!playerStats[pid]) {
        playerStats[pid] = {
          nickname: rp.player.pubg_nickname,
          tier: rp.player.tier,
          wins: 0,
          losses: 0,
          total: 0,
        }
      }
      playerStats[pid].total += 1
      if (rp.team_number === room.winner_team) {
        playerStats[pid].wins += 1
      } else {
        playerStats[pid].losses += 1
      }
    }
  }

  const sorted = Object.values(playerStats).sort(
    (a, b) => b.wins - a.wins || b.total - a.total
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-muted-foreground text-sm mt-1">
          종료된 내전 {rooms.length}판 기준
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">개인 승/패 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sorted.map((p, i) => (
              <div
                key={p.nickname}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground text-sm w-5 text-right">{i + 1}</span>
                <Badge className={`text-xs shrink-0 ${TIER_COLORS[p.tier]}`}>
                  {p.tier}T
                </Badge>
                <span className="flex-1 font-medium">{p.nickname}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-yellow-400 font-bold">{p.wins}승</span>
                  <span className="text-muted-foreground">{p.losses}패</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {p.total > 0 ? Math.round((p.wins / p.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 내전 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(rooms as unknown as RoomWithPlayers[]).map((room) => {
            if (!room.winner_team) return null
            const winners = room.room_players
              .filter((rp) => rp.team_number === room.winner_team)
              .map((rp) => rp.player.pubg_nickname)
            return (
              <div key={room.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground text-xs w-20 shrink-0">
                  {new Date(room.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex-1 truncate">{room.title}</span>
                <span className="text-yellow-400 font-medium shrink-0">
                  🏆 {['Team A', 'Team B', 'Team C'][room.winner_team - 1]}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
