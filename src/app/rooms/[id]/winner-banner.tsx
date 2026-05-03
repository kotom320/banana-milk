import { Player, RoomPlayer } from '@/types'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']

type RoomPlayerWithPlayer = RoomPlayer & { player: Player }

export function WinnerBanner({
  winnerTeam,
  roomPlayers,
}: {
  winnerTeam: 1 | 2 | 3
  roomPlayers: RoomPlayerWithPlayer[]
}) {
  const winners = roomPlayers.filter((rp) => rp.team_number === winnerTeam)
  const idx = winnerTeam - 1

  return (
    <div className="rounded-xl border-2 border-yellow-400 bg-yellow-400/5 px-6 py-5 text-center space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-widest">내전 종료 · 우승</p>
      <p className={`text-3xl font-bold ${TEAM_COLORS[idx]}`}>
        🏆 {TEAM_LABELS[idx]}
      </p>
      <p className="text-sm text-muted-foreground">
        {winners.map((rp) => rp.player.pubg_nickname).join(' · ')}
      </p>
      <p className="text-xs text-yellow-400 font-medium mt-1">
        바나나우유 받아가세요 🍌
      </p>
    </div>
  )
}
