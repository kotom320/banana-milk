'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Player, RoomPlayer, Tier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { movePlayerTeam } from '@/app/actions/room'

const TIER_COLORS: Record<Tier, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

const TEAM_BORDER = ['border-red-500/50', 'border-blue-500/50', 'border-green-500/50']
const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const TEAM_TEXT = ['text-red-400', 'text-blue-400', 'text-green-400']

type RoomPlayerWithPlayer = RoomPlayer & { player: Player }

function getTierScore(tier: Tier) {
  return { 1: 100, 2: 70, 3: 40, 4: 15 }[tier]
}

export function TeamView({
  teams: initialTeams,
  teamCount,
  roomId,
  isDone = false,
}: {
  teams: Record<number, RoomPlayerWithPlayer[]>
  teamCount: 2 | 3
  roomId: string
  isDone?: boolean
}) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [pending, startTransition] = useTransition()

  function handleMove(rp: RoomPlayerWithPlayer, newTeam: 1 | 2 | 3) {
    if (newTeam === rp.team_number) return

    // 낙관적 업데이트
    setTeams((prev) => {
      const next: Record<number, RoomPlayerWithPlayer[]> = {}
      for (let i = 1; i <= 3; i++) {
        next[i] = (prev[i] ?? []).filter((p) => p.id !== rp.id)
      }
      next[newTeam] = [...(next[newTeam] ?? []), { ...rp, team_number: newTeam }]
      return next
    })

    startTransition(async () => {
      try {
        await movePlayerTeam(rp.id, newTeam, roomId)
        router.refresh()
      } catch {
        toast.error('팀 이동 실패')
        setTeams(initialTeams) // 롤백
      }
    })
  }

  return (
    <div className={`grid gap-4 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {Array.from({ length: teamCount }, (_, i) => i + 1).map((teamNum) => {
        const members = teams[teamNum] ?? []
        const totalScore = members.reduce((sum, m) => sum + getTierScore(m.player.tier), 0)

        return (
          <Card key={teamNum} className={TEAM_BORDER[teamNum - 1]}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-base ${TEAM_TEXT[teamNum - 1]}`}>
                {TEAM_LABELS[teamNum - 1]}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                밸런스 {totalScore}점 · {members.length}명
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((rp) => (
                <div key={rp.id} className="flex items-center gap-2 text-sm">
                  <Badge className={`text-xs shrink-0 ${TIER_COLORS[rp.player.tier]}`}>
                    {rp.player.tier}T
                  </Badge>
                  <span className="flex-1 truncate">{rp.player.pubg_nickname}</span>
                  {!isDone && (
                    <select
                      disabled={pending}
                      value={rp.team_number}
                      onChange={(e) => handleMove(rp, Number(e.target.value) as 1 | 2 | 3)}
                      className="text-xs bg-background border border-border rounded px-1 py-0.5 text-muted-foreground hover:border-foreground/40 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {Array.from({ length: teamCount }, (_, i) => i + 1).map((t) => (
                        <option key={t} value={t}>
                          {TEAM_LABELS[t - 1]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  없음
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
