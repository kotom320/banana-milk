'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'
import { Player, RoomPlayer, Tier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { movePlayerTeam } from '@/app/actions/room'
import { notifyRoomMutation } from './realtime-sync'

const TIER_COLORS: Record<Tier, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

const TEAM_BORDER = ['border-red-500/50', 'border-blue-500/50', 'border-green-500/50']
export const TEAM_LABELS = ['Team 1', 'Team 2', 'Team 3']
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
  const [pending, setPending] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverTeam, setDragOverTeam] = useState<number | null>(null)

  async function handleMove(rp: RoomPlayerWithPlayer, newTeam: 1 | 2 | 3) {
    if (newTeam === rp.team_number || pending) return

    setPending(true)
    setTeams((prev) => {
      const next: Record<number, RoomPlayerWithPlayer[]> = {}
      for (let i = 1; i <= 3; i++) {
        next[i] = (prev[i] ?? []).filter((p) => p.id !== rp.id)
      }
      next[newTeam] = [...(next[newTeam] ?? []), { ...rp, team_number: newTeam }]
      return next
    })

    try {
      await movePlayerTeam(rp.id, newTeam, roomId)
      router.refresh()
      notifyRoomMutation(roomId)
    } catch {
      toast.error('팀 이동 실패')
      setTeams(initialTeams)
    } finally {
      setPending(false)
    }
  }

  function findRp(id: string) {
    return Object.values(teams).flat().find((p) => p.id === id)
  }

  return (
    <div className={`grid gap-4 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {Array.from({ length: teamCount }, (_, i) => i + 1).map((teamNum) => {
        const members = teams[teamNum] ?? []
        const totalScore = members.reduce((sum, m) => sum + getTierScore(m.player.tier), 0)
        const isOver = dragOverTeam === teamNum

        return (
          <Card
            key={teamNum}
            className={`${TEAM_BORDER[teamNum - 1]} transition-colors ${
              isOver ? 'bg-muted/40 border-dashed' : ''
            }`}
            onDragOver={(e) => {
              if (isDone) return
              e.preventDefault()
              setDragOverTeam(teamNum)
            }}
            onDragLeave={(e) => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setDragOverTeam(null)
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('rpId')
              const rp = findRp(id)
              if (rp) handleMove(rp, teamNum as 1 | 2 | 3)
              setDragOverTeam(null)
              setDraggingId(null)
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className={`text-base ${TEAM_TEXT[teamNum - 1]}`}>
                {TEAM_LABELS[teamNum - 1]}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                밸런스 {totalScore}점 · {members.length}명
              </p>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[40px]">
              {members.map((rp) => (
                <div
                  key={rp.id}
                  draggable={!isDone && !pending}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('rpId', rp.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggingId(rp.id)
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragOverTeam(null)
                  }}
                  className={`flex items-center gap-2 text-sm rounded-md transition-opacity select-none ${
                    !isDone ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${draggingId === rp.id ? 'opacity-40' : ''}`}
                >
                  {!isDone && (
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  <Badge className={`text-xs shrink-0 ${TIER_COLORS[rp.player.tier]}`}>
                    {rp.player.tier}T
                  </Badge>
                  <span className="flex-1 truncate">{rp.player.pubg_nickname}</span>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">없음</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
