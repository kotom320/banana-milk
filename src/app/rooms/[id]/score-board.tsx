'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RoundResult } from '@/types'
import { ScoringRuleKey, SCORING_RULES, calcTeamScore } from '@/lib/scoring-rules'
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

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']

export function ScoreBoard({
  rounds,
  teamCount,
  scoringRuleKey,
  roomId,
}: {
  rounds: RoundResult[]
  teamCount: 2 | 3
  scoringRuleKey: ScoringRuleKey
  roomId: string
}) {
  const router = useRouter()
  const [currentRuleKey, setCurrentRuleKey] = useState<ScoringRuleKey>(scoringRuleKey)
  const rule = SCORING_RULES[currentRuleKey]
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

  const RuleSelector = () => (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {(Object.values(SCORING_RULES) as typeof SCORING_RULES[ScoringRuleKey][]).map((r) => (
        <button
          key={r.key}
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
    const scores = [
      calcTeamScore(rule, r.team1_placement, r.team1_kills),
      calcTeamScore(rule, r.team2_placement, r.team2_kills),
      teamCount === 3 && r.team3_placement != null
        ? calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
        : null,
    ]
    scores.forEach((s, i) => { if (s !== null) totals[i] += s })
    return { round: r, scores }
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
              {roundRows.map(({ round, scores }) => (
                <TableRow key={round.round_number}>
                  <TableCell className="font-medium">{round.round_number}R</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {round.map_name ?? '-'}
                  </TableCell>
                  {scores.slice(0, teamCount).map((s, i) => (
                    <TableCell key={i} className="text-right">
                      {s ?? '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground h-6 px-2"
                      onClick={() => setEditingRound(round)}
                    >
                      수정
                    </Button>
                  </TableCell>
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
                  { placement: String(editingRound.team1_placement), kills: String(editingRound.team1_kills) },
                  { placement: String(editingRound.team2_placement), kills: String(editingRound.team2_kills) },
                  { placement: String(editingRound.team3_placement ?? ''), kills: String(editingRound.team3_kills ?? '') },
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
