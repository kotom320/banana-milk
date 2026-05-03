import { Player, RoomPlayer, Tier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TIER_COLORS: Record<Tier, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

const TEAM_COLORS = ['border-red-500/50', 'border-blue-500/50', 'border-green-500/50']
const TEAM_LABELS = ['Team A', 'Team B', 'Team C']

type RoomPlayerWithPlayer = RoomPlayer & { player: Player }

export function TeamView({
  teams,
  teamCount,
}: {
  teams: Record<number, RoomPlayerWithPlayer[]>
  teamCount: 2 | 3
}) {
  return (
    <div className={`grid gap-4 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {Array.from({ length: teamCount }, (_, i) => i + 1).map((teamNum) => {
        const members = teams[teamNum] ?? []
        const totalScore = members.reduce((sum, m) => sum + m.player.tier, 0)

        return (
          <Card key={teamNum} className={TEAM_COLORS[teamNum - 1]}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{TEAM_LABELS[teamNum - 1]}</CardTitle>
              <p className="text-xs text-muted-foreground">
                티어합 {totalScore} · {members.length}명
              </p>
            </CardHeader>
            <CardContent className="space-y-1">
              {members.map((rp) => (
                <div
                  key={rp.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge className={`text-xs ${TIER_COLORS[rp.player.tier]}`}>
                    {rp.player.tier}T
                  </Badge>
                  <span>{rp.player.pubg_nickname}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {rp.player.playstyle}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
