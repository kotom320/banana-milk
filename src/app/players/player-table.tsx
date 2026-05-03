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
import { InfoTooltip } from '@/components/info-tooltip'

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
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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
          <TableHead>
            <span className="flex items-center gap-1">
              티어
              <InfoTooltip>
                {`평균딜(70%) + 평균킬×80(30%)으로 산정\n\n1티어: 350점 이상 (상위권)\n2티어: 220~349점 (평균 이상)\n3티어: 120~219점 (보통)\n4티어: 120점 미만 (입문)`}
              </InfoTooltip>
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1">
              스타일
              <InfoTooltip>
                {`최근 전적 분석 기반 플레이 성향\n\n공격형 캐리: 딜량 400↑, 킬 2.5↑\n단기결전형: 분당딜량 높고 생존시간 짧음\n치킨런너: 생존시간 25분↑, 딜량 낮음\n올라운더: 균형잡힌 스탯\n서포터형: 딜량 150 미만`}
              </InfoTooltip>
            </span>
          </TableHead>
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
              <span className="flex items-center gap-1">
                <Badge className={TIER_COLORS[p.tier]}>{TIER_LABEL[p.tier]}</Badge>
                <InfoTooltip>
                  {`산정 점수: ${Math.round(p.avg_damage * 0.7 + p.avg_kills * 80 * 0.3)}점\n딜 기여: ${Math.round(p.avg_damage * 0.7)}점\n킬 기여: ${Math.round(p.avg_kills * 80 * 0.3)}점`}
                </InfoTooltip>
              </span>
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
