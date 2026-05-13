'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScoringRule, ScoringRuleKey, SCORING_RULES } from '@/lib/scoring-rules'
import { updateScoringRuleConfig, resetScoringRuleConfig } from '@/app/actions/settings'

const PLACEMENT_COUNT = 10

interface Props {
  rule: ScoringRule
  isCustomized: boolean
}

export function RuleEditForm({ rule, isCustomized }: Props) {
  const router = useRouter()
  const [name, setName] = useState(rule.name)
  const [killPoint, setKillPoint] = useState(String(rule.killPoint))
  const [placements, setPlacements] = useState<string[]>(
    Array.from({ length: PLACEMENT_COUNT }, (_, i) => String(rule.placements[i] ?? 0))
  )
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  function updatePlacement(idx: number, value: string) {
    setPlacements((prev) => prev.map((v, i) => (i === idx ? value : v)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateScoringRuleConfig(
        rule.key,
        name.trim() || rule.name,
        `${placements[0]}점 · 킬당 ${killPoint}점`,
        placements.map((v) => Number(v) || 0),
        Number(killPoint) || 0
      )
      toast.success(`${name} 저장 완료`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      await resetScoringRuleConfig(rule.key as ScoringRuleKey)
      const defaults = SCORING_RULES[rule.key as ScoringRuleKey]
      setName(defaults.name)
      setKillPoint(String(defaults.killPoint))
      setPlacements(
        Array.from({ length: PLACEMENT_COUNT }, (_, i) => String(defaults.placements[i] ?? 0))
      )
      toast.success('기본값으로 초기화')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '초기화 실패')
    } finally {
      setResetting(false)
    }
  }

  const previewDesc = `${placements[0]}점 · 킬당 ${killPoint}점`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-base font-semibold border-none px-0 focus-visible:ring-0 w-40"
            />
            {isCustomized && (
              <span className="text-[10px] text-yellow-400 border border-yellow-400/40 rounded px-1.5 py-0.5 font-normal">
                수정됨
              </span>
            )}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{previewDesc}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">순위별 점수 (1위 ~ 10위)</Label>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: PLACEMENT_COUNT }, (_, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-[10px] text-muted-foreground text-center block">{i + 1}위</Label>
                <Input
                  type="number"
                  min={0}
                  value={placements[i]}
                  onChange={(e) => updatePlacement(i, e.target.value)}
                  className="text-center h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="space-y-1 w-32">
            <Label className="text-xs text-muted-foreground">킬당 점수</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={killPoint}
              onChange={(e) => setKillPoint(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {isCustomized && (
              <Button
                size="sm"
                variant="ghost"
                disabled={resetting}
                onClick={handleReset}
                className="text-muted-foreground text-xs"
              >
                {resetting ? '...' : '기본값으로'}
              </Button>
            )}
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-yellow-400 text-black hover:bg-yellow-300"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
