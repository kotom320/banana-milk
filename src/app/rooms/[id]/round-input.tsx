'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PUBG_MAPS } from '@/lib/pubg-maps'
import { submitTeamResult } from '@/app/actions/room'
import { RoundResult } from '@/types'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']

interface TeamState {
  placement: string
  kills: string
  editing: boolean
  saving: boolean
}

function getTeamData(r: RoundResult | undefined, teamNumber: 1 | 2 | 3) {
  if (!r) return { placement: null, kills: null }
  if (teamNumber === 1) return { placement: r.team1_placement, kills: r.team1_kills }
  if (teamNumber === 2) return { placement: r.team2_placement, kills: r.team2_kills }
  return { placement: r.team3_placement ?? null, kills: r.team3_kills ?? null }
}

export function RoundInput({
  roomId,
  roundNumber,
  teamCount,
  existingData,
}: {
  roomId: string
  roundNumber: number
  teamCount: 2 | 3
  existingData?: RoundResult
}) {
  const router = useRouter()
  const [mapName, setMapName] = useState(existingData?.map_name ?? '에란겔')

  const [teams, setTeams] = useState<TeamState[]>(() =>
    Array.from({ length: teamCount }, (_, i) => {
      const { placement, kills } = getTeamData(existingData, (i + 1) as 1 | 2 | 3)
      const hasSaved = placement != null
      return {
        placement: hasSaved ? String(placement) : '',
        kills: hasSaved ? String(kills ?? 0) : '',
        editing: !hasSaved,
        saving: false,
      }
    })
  )

  function setTeam(idx: number, patch: Partial<TeamState>) {
    setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  async function handleSave(idx: number) {
    const t = teams[idx]
    if (!t.placement || !t.kills) return
    const teamNumber = (idx + 1) as 1 | 2 | 3

    setTeam(idx, { saving: true })
    try {
      await submitTeamResult(roomId, roundNumber, teamNumber, mapName, Number(t.placement), Number(t.kills))
      toast.success(`${TEAM_LABELS[idx]} ${roundNumber}라운드 저장`)
      setTeam(idx, { editing: false, saving: false })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
      setTeam(idx, { saving: false })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{roundNumber}라운드 진행 중</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">맵</Label>
          <div className="flex flex-wrap gap-1.5">
            {PUBG_MAPS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMapName(m)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs border transition-colors',
                  mapName === m
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: teamCount }, (_, i) => {
            const t = teams[i]
            const isValid = t.placement !== '' && t.kills !== ''

            return (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${TEAM_COLORS[i]}`}>{TEAM_LABELS[i]}</span>
                  {!t.editing && (
                    <span className="text-xs text-green-500">
                      {t.placement}위 · {t.kills}킬 ✓
                    </span>
                  )}
                </div>

                {t.editing ? (
                  <div className="flex items-end gap-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs text-muted-foreground">순위</Label>
                      <Input
                        type="number"
                        min={1}
                        max={64}
                        placeholder="예: 3"
                        value={t.placement}
                        onChange={(e) => setTeam(i, { placement: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs text-muted-foreground">킬 수</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="예: 5"
                        value={t.kills}
                        onChange={(e) => setTeam(i, { kills: e.target.value })}
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={!isValid || t.saving}
                      onClick={() => handleSave(i)}
                      className="bg-yellow-400 text-black hover:bg-yellow-300 shrink-0"
                    >
                      {t.saving ? '...' : '저장'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground h-6 px-2"
                    onClick={() => setTeam(i, { editing: true })}
                  >
                    수정
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
