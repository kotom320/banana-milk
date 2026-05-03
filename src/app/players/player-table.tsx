'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Player, Tier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { refreshPlayer, deletePlayer } from '@/app/actions/player'

const TIER_COLORS: Record<Tier, string> = {
  1: 'bg-yellow-400 text-black',
  2: 'bg-blue-500 text-white',
  3: 'bg-green-600 text-white',
  4: 'bg-zinc-500 text-white',
}

const TIER_LABEL: Record<Tier, string> = {
  1: '1티어',
  2: '2티어',
  3: '3티어',
  4: '4티어',
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR')
}

export function PlayerTable({ players }: { players: Player[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleRefresh(player: Player) {
    setLoadingId(player.id)
    try {
      const updated = await refreshPlayer(player.id, player.pubg_nickname)
      toast.success(`${updated.pubg_nickname} 갱신 완료 — ${updated.tier}티어`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '갱신 실패')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(player: Player) {
    if (!confirm(`${player.pubg_nickname}을(를) 삭제할까요?`)) return
    try {
      await deletePlayer(player.id)
      toast.success(`${player.pubg_nickname} 삭제 완료`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  if (players.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        등록된 플레이어가 없습니다. 위에서 닉네임을 추가해보세요.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>닉네임</TableHead>
          <TableHead>티어</TableHead>
          <TableHead>스타일</TableHead>
          <TableHead className="text-right">평균딜</TableHead>
          <TableHead className="text-right">평균킬</TableHead>
          <TableHead className="text-right">평균생존</TableHead>
          <TableHead className="text-right">분석 경기</TableHead>
          <TableHead className="text-right">갱신일</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.pubg_nickname}</TableCell>
            <TableCell>
              <Badge className={TIER_COLORS[p.tier]}>{TIER_LABEL[p.tier]}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.playstyle}</TableCell>
            <TableCell className="text-right">{p.avg_damage}</TableCell>
            <TableCell className="text-right">{p.avg_kills}</TableCell>
            <TableCell className="text-right text-sm">{formatTime(p.avg_survival_time)}</TableCell>
            <TableCell className="text-right text-sm">{p.matches_analyzed}판</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDate(p.last_updated_at)}
            </TableCell>
            <TableCell>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingId === p.id}
                  onClick={() => handleRefresh(p)}
                >
                  {loadingId === p.id ? '갱신 중...' : '갱신'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(p)}
                >
                  삭제
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
