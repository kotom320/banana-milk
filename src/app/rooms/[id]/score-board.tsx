'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RoundResult } from '@/types'
import { ScoringRule, ScoringRuleKey, SCORING_RULES, calcTeamScore } from '@/lib/scoring-rules'
import { submitRoundResult, updateScoringRule, RoundResultInput } from '@/app/actions/room'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoundForm } from './round-form'
import { InfoTooltip } from '@/components/info-tooltip'

const TEAM_LABELS = ['Team 1', 'Team 2', 'Team 3']

export function ScoreBoard({
  rounds,
  teamCount,
  scoringRuleKey,
  rules = SCORING_RULES,
  roomId,
  isDone = false,
}: {
  rounds: RoundResult[]
  teamCount: 2 | 3
  scoringRuleKey: ScoringRuleKey
  rules?: Record<ScoringRuleKey, ScoringRule>
  roomId: string
  isDone?: boolean
}) {
  const router = useRouter()
  const [currentRuleKey, setCurrentRuleKey] = useState<ScoringRuleKey>(scoringRuleKey)
  const rule = rules[currentRuleKey]
  const [editingRound, setEditingRound] = useState<RoundResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [ruleChanging, setRuleChanging] = useState(false)

  async function handleRuleChange(key: ScoringRuleKey) {
    if (key === currentRuleKey) return
    setCurrentRuleKey(key)
    setRuleChanging(true)
    try {
      await updateScoringRule(roomId, key)
      router.refresh()
    } catch {
      toast.error('룰 변경 실패')
      setCurrentRuleKey(currentRuleKey)
    } finally {
      setRuleChanging(false)
    }
  }

  async function handleEdit(data: RoundResultInput) {
    if (!editingRound) return
    setLoading(true)
    try {
      await submitRoundResult(roomId, editingRound.round_number, data)
      toast.success(`${editingRound.round_number}라운드 수정 완료`)
      setEditingRound(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '수정 실패')
    } finally {
      setLoading(false)
    }
  }

  const RuleSelector = () => isDone ? null : (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {(Object.values(rules) as ScoringRule[]).map((r) => (
        <span key={r.key} className="inline-flex items-center gap-1">
          <button
            disabled={ruleChanging}
            onClick={() => handleRuleChange(r.key)}
            className={`px-2 py-0.5 rounded text-xs border transition-colors disabled:opacity-50 ${
              currentRuleKey === r.key
                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            }`}
          >
            {r.name}
          </button>
          <InfoTooltip>{r.tooltip}</InfoTooltip>
        </span>
      ))}
    </div>
  )

  if (rounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">점수판</CardTitle>
          <RuleSelector />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            아직 기록된 라운드가 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totals = [0, 0, 0]

  const roundRows = rounds.map((r) => {
    const isComplete =
      r.team1_placement != null &&
      r.team2_placement != null &&
      (teamCount !== 3 || r.team3_placement != null)

    const scores = [
      r.team1_placement != null ? calcTeamScore(rule, r.team1_placement, r.team1_kills ?? 0) : null,
      r.team2_placement != null ? calcTeamScore(rule, r.team2_placement, r.team2_kills ?? 0) : null,
      teamCount === 3 && r.team3_placement != null
        ? calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
        : null,
    ]
    if (isComplete) {
      scores.forEach((s, i) => { if (s !== null) totals[i] += s })
    }
    return { round: r, scores, isComplete }
  })

  const winnerIdx = totals
    .slice(0, teamCount)
    .indexOf(Math.max(...totals.slice(0, teamCount)))

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">점수판</CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              {rule.description}
            </Badge>
          </div>
          <RuleSelector />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>라운드</TableHead>
                <TableHead>맵</TableHead>
                {Array.from({ length: teamCount }, (_, i) => (
                  <TableHead key={i} className="text-right">
                    {TEAM_LABELS[i]}
                  </TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roundRows.map(({ round, scores, isComplete }) => (
                <TableRow key={round.round_number}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5">
                      {round.round_number}R
                      {!isComplete && (
                        <span className="text-[10px] text-yellow-400 border border-yellow-400/40 rounded px-1 py-0.5 leading-none">
                          진행 중
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {round.map_name ?? '-'}
                  </TableCell>
                  {scores.slice(0, teamCount).map((s, i) => (
                    <TableCell key={i} className="text-right">
                      {s ?? '-'}
                    </TableCell>
                  ))}
                  {!isDone && (
                    <TableCell className="text-right">
                      {isComplete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground h-6 px-2"
                          onClick={() => setEditingRound(round)}
                        >
                          수정
                        </Button>
                      )}
                    </TableCell>
                  )}
                  {isDone && <TableCell />}
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={2}>합계</TableCell>
                {totals.slice(0, teamCount).map((t, i) => (
                  <TableCell
                    key={i}
                    className={`text-right ${i === winnerIdx ? 'text-yellow-400' : ''}`}
                  >
                    {t}점 {i === winnerIdx ? '🏆' : ''}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingRound} onOpenChange={(open) => !open && setEditingRound(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRound?.round_number}라운드 수정</DialogTitle>
          </DialogHeader>
          {editingRound && (
            <RoundForm
              teamCount={teamCount}
              initialData={{
                mapName: editingRound.map_name ?? '에란겔',
                teams: [
                  { placement: editingRound.team1_placement != null ? String(editingRound.team1_placement) : '', kills: editingRound.team1_kills != null ? String(editingRound.team1_kills) : '' },
                  { placement: editingRound.team2_placement != null ? String(editingRound.team2_placement) : '', kills: editingRound.team2_kills != null ? String(editingRound.team2_kills) : '' },
                  { placement: editingRound.team3_placement != null ? String(editingRound.team3_placement) : '', kills: editingRound.team3_kills != null ? String(editingRound.team3_kills) : '' },
                ],
              }}
              submitLabel="수정 저장"
              loading={loading}
              onSubmit={handleEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
