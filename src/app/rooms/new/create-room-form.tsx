'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Player, Tier } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createRoom } from '@/app/actions/room'

const TIER_COLORS: Record<Tier, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

export function CreateRoomForm({ players }: { players: Player[] }) {
  const router = useRouter()
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const [title, setTitle] = useState(`${today} 내전`)
  const [teamCount, setTeamCount] = useState<2 | 3>(2)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selected = players.filter((p) => selectedIds.has(p.id))
  const teamSize = Math.ceil(selected.length / teamCount)
  const canCreate = selected.length >= teamCount * 2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreate) return

    setLoading(true)
    try {
      const room = await createRoom(title, teamCount, [...selectedIds])
      toast.success('내전 방이 생성되었습니다!')
      router.push(`/rooms/${room.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '생성 실패')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">방 이름</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 5월 3일 내전"
        />
      </div>

      <div className="space-y-2">
        <Label>팀 수</Label>
        <div className="flex gap-2">
          {([2, 3] as const).map((n) => (
            <Button
              key={n}
              type="button"
              variant={teamCount === n ? 'default' : 'outline'}
              className={teamCount === n ? 'bg-yellow-400 text-black hover:bg-yellow-300' : ''}
              onClick={() => setTeamCount(n)}
            >
              {n}팀
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          참가 인원 선택{' '}
          <span className="text-muted-foreground font-normal">
            ({selected.length}명 선택 / 팀당 약 {teamSize}명)
          </span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlayer(p.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left',
                selectedIds.has(p.id)
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-border hover:border-border/80'
              )}
            >
              <Badge className={cn('text-xs shrink-0', TIER_COLORS[p.tier])}>
                {p.tier}T
              </Badge>
              <span className="truncate">{p.pubg_nickname}</span>
            </button>
          ))}
        </div>
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground">
            플레이어를 먼저 등록해주세요.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!canCreate || loading}
        className="bg-yellow-400 text-black hover:bg-yellow-300 w-full"
      >
        {loading
          ? '생성 중...'
          : canCreate
          ? `팀 배분 & 내전 시작 (${selected.length}명)`
          : `최소 ${teamCount * 2}명을 선택해주세요`}
      </Button>
    </form>
  )
}
