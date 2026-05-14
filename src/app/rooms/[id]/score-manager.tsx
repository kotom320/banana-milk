'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { InfoTooltip } from '@/components/info-tooltip'
import { RoundInput } from './round-input'
import { RoundForm } from './round-form'
import { RoundResult } from '@/types'
import { ScoringRule, ScoringRuleKey, SCORING_RULES, calcTeamScore } from '@/lib/scoring-rules'
import { submitRoundResult, updateScoringRule, RoundResultInput } from '@/app/actions/room'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']
const MAX_ROUNDS = 10

function isComplete(r: RoundResult, teamCount: number) {
  return (
    r.team1_placement != null &&
    r.team2_placement != null &&
    (teamCount !== 3 || r.team3_placement != null)
  )
}

export function ScoreManager({
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

  // ── 점수판 상태 ──────────────────────────────────
  const [currentRuleKey, setCurrentRuleKey] = useState<ScoringRuleKey>(scoringRuleKey)
  const rule = rules[currentRuleKey]
  const [editingRound, setEditingRound] = useState<RoundResult | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [ruleChanging, setRuleChanging] = useState(false)

  // ── 라운드 관리 상태 ─────────────────────────────
  const incompleteRounds = rounds.filter((r) => !isComplete(r, teamCount))
  const incompleteNumbers = new Set(incompleteRounds.map((r) => r.round_number))
  const allNumbers = new Set(rounds.map((r) => r.round_number))

  const nextDefault = Math.max(...[...allNumbers], 0) + 1
  const [shownRounds, setShownRounds] = useState<number[]>(() =>
    incompleteRounds.length > 0
      ? incompleteRounds.map((r) => r.round_number)
      : nextDefault <= MAX_ROUNDS
      ? [nextDefault]
      : []
  )

  // 진행 중인 라운드 = (shownRounds ∪ incompleteNumbers) - complete
  const pendingList = [...new Set([...shownRounds, ...incompleteNumbers])]
    .filter((n) => !allNumbers.has(n) || incompleteNumbers.has(n))
    .sort((a, b) => a - b)

  const nextToAdd = Math.max(...pendingList, ...[...allNumbers], 0) + 1
  const canAdd = !isDone && nextToAdd <= MAX_ROUNDS

  // ── 핸들러 ──────────────────────────────────────
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
    setEditLoading(true)
    try {
      await submitRoundResult(roomId, editingRound.round_number, data)
      toast.success(`${editingRound.round_number}라운드 수정 완료`)
      setEditingRound(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '수정 실패')
    } finally {
      setEditLoading(false)
    }
  }

  // ── 점수 계산 ────────────────────────────────────
  const totals = [0, 0, 0]
  const roundRows = rounds.map((r) => {
    const complete = isComplete(r, teamCount)
    const scores = [
      r.team1_placement != null ? calcTeamScore(rule, r.team1_placement, r.team1_kills ?? 0) : null,
      r.team2_placement != null ? calcTeamScore(rule, r.team2_placement, r.team2_kills ?? 0) : null,
      teamCount === 3 && r.team3_placement != null
        ? calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
        : null,
    ]
    if (complete) scores.forEach((s, i) => { if (s !== null) totals[i] += s })
    return { round: r, scores, complete }
  })

  const winnerIdx = totals.slice(0, teamCount).indexOf(Math.max(...totals.slice(0, teamCount)))

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
          {!isDone && (
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
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── 점수 테이블 ── */}
          {rounds.length > 0 && (
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
                {roundRows.map(({ round, scores, complete }) => (
                  <TableRow key={round.round_number}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1.5">
                        {round.round_number}R
                        {!complete && (
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
                    <TableCell className="text-right">
                      {!isDone && complete && (
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
          )}

          {/* ── 진행 중인 라운드 입력 ── */}
          {!isDone && pendingList.length > 0 && (
            <div className="space-y-6 pt-2">
              {rounds.length > 0 && <div className="border-t border-border" />}
              {pendingList.map((n) => (
                <div key={n}>
                  <p className="text-sm font-medium mb-3 text-muted-foreground">
                    {n}라운드 진행 중
                  </p>
                  <RoundInput
                    roomId={roomId}
                    roundNumber={n}
                    teamCount={teamCount}
                    existingData={incompleteRounds.find((r) => r.round_number === n)}
                    noCard
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── 라운드 추가 버튼 ── */}
          {canAdd && (
            <Button
              variant="outline"
              className="w-full border-dashed text-muted-foreground gap-1.5"
              onClick={() => setShownRounds((prev) => [...prev, nextToAdd])}
            >
              <Plus className="w-3.5 h-3.5" />
              {nextToAdd}라운드 추가
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── 수정 다이얼로그 ── */}
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
              loading={editLoading}
              onSubmit={handleEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
