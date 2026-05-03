'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitRoundResult } from '@/app/actions/room'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']

interface TeamInput {
  placement: string
  kills: string
}

export function RoundInput({
  roomId,
  roundNumber,
  teamCount,
}: {
  roomId: string
  roundNumber: number
  teamCount: 2 | 3
}) {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamInput[]>(
    Array.from({ length: teamCount }, () => ({ placement: '', kills: '' }))
  )
  const [loading, setLoading] = useState(false)

  function update(idx: number, field: keyof TeamInput, value: string) {
    setTeams((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    )
  }

  const isValid = teams
    .slice(0, teamCount)
    .every((t) => t.placement !== '' && t.kills !== '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    try {
      await submitRoundResult(roomId, roundNumber, {
        team1Placement: Number(teams[0].placement),
        team1Kills: Number(teams[0].kills),
        team2Placement: Number(teams[1].placement),
        team2Kills: Number(teams[1].kills),
        team3Placement: teamCount === 3 ? Number(teams[2].placement) : undefined,
        team3Kills: teamCount === 3 ? Number(teams[2].kills) : undefined,
      })
      toast.success(`${roundNumber}라운드 결과 기록 완료`)
      router.refresh()
      setTeams(Array.from({ length: teamCount }, () => ({ placement: '', kills: '' })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{roundNumber}라운드 결과 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`grid gap-4 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Array.from({ length: teamCount }, (_, i) => (
              <div key={i} className="space-y-2">
                <p className={`text-sm font-medium ${TEAM_COLORS[i]}`}>
                  {TEAM_LABELS[i]}
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">순위</Label>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    placeholder="예: 3"
                    value={teams[i].placement}
                    onChange={(e) => update(i, 'placement', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">킬 수</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="예: 5"
                    value={teams[i].kills}
                    onChange={(e) => update(i, 'kills', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={!isValid || loading}
            className="bg-yellow-400 text-black hover:bg-yellow-300 w-full"
          >
            {loading ? '저장 중...' : `${roundNumber}라운드 기록`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
