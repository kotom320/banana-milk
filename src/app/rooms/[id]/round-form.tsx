'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PUBG_MAPS } from '@/lib/pubg-maps'
import { RoundResultInput } from '@/app/actions/room'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']

interface TeamInput {
  placement: string
  kills: string
}

interface Props {
  teamCount: 2 | 3
  initialData?: {
    mapName: string
    teams: TeamInput[]
  }
  submitLabel: string
  loading: boolean
  onSubmit: (data: RoundResultInput) => void
}

export function RoundForm({ teamCount, initialData, submitLabel, loading, onSubmit }: Props) {
  const [mapName, setMapName] = useState(initialData?.mapName ?? '에란겔')
  const [teams, setTeams] = useState<TeamInput[]>(
    initialData?.teams ??
      Array.from({ length: teamCount }, () => ({ placement: '', kills: '' }))
  )

  function update(idx: number, field: keyof TeamInput, value: string) {
    setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  const isValid = teams
    .slice(0, teamCount)
    .every((t) => t.placement !== '' && t.kills !== '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      mapName,
      team1Placement: Number(teams[0].placement),
      team1Kills: Number(teams[0].kills),
      team2Placement: Number(teams[1].placement),
      team2Kills: Number(teams[1].kills),
      team3Placement: teamCount === 3 ? Number(teams[2].placement) : undefined,
      team3Kills: teamCount === 3 ? Number(teams[2].kills) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className={`grid gap-4 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {Array.from({ length: teamCount }, (_, i) => (
          <div key={i} className="space-y-2">
            <p className={`text-sm font-medium ${TEAM_COLORS[i]}`}>{TEAM_LABELS[i]}</p>
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
        {loading ? '저장 중...' : submitLabel}
      </Button>
    </form>
  )
}
