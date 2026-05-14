'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { RoundForm } from './round-form'
import { RoundResult } from '@/types'
import { ScoringRule, ScoringRuleKey, SCORING_RULES, calcTeamScore } from '@/lib/scoring-rules'
import { submitRoundResult, submitTeamResult, updateScoringRule, RoundResultInput } from '@/app/actions/room'
import { PUBG_MAPS } from '@/lib/pubg-maps'

const TEAM_LABELS = ['Team 1', 'Team 2', 'Team 3']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']
const MAX_ROUNDS = 10

function isRoundComplete(r: RoundResult, teamCount: number) {
  return (
    r.team1_placement != null &&
    r.team2_placement != null &&
    (teamCount !== 3 || r.team3_placement != null)
  )
}

function getTeamData(r: RoundResult | undefined, teamNumber: 1 | 2 | 3) {
  if (!r) return { placement: null, kills: null }
  if (teamNumber === 1) return { placement: r.team1_placement, kills: r.team1_kills }
  if (teamNumber === 2) return { placement: r.team2_placement, kills: r.team2_kills }
  return { placement: r.team3_placement ?? null, kills: r.team3_kills ?? null }
}

interface TeamState {
  placement: string
  kills: string
  editing: boolean
  saving: boolean
}

// ── 편집 가능한 행 ─────────────────────────────────────────────
function EditableRoundRow({
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
    setTeam(idx, { saving: true })
    try {
      await submitTeamResult(roomId, roundNumber, (idx + 1) as 1 | 2 | 3, mapName, Number(t.placement), Number(t.kills))
      toast.success(`${TEAM_LABELS[idx]} ${roundNumber}R 저장`)
      setTeam(idx, { editing: false, saving: false })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
      setTeam(idx, { saving: false })
    }
  }

  return (
    <TableRow className="bg-muted/20">
      <TableCell className="font-medium">{roundNumber}R</TableCell>
      <TableCell>
        <select
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          className="text-xs bg-transparent border border-border rounded px-1.5 py-1 text-foreground cursor-pointer"
        >
          {PUBG_MAPS.map((m) => (
            <option key={m} value={m} className="bg-background">
              {m}
            </option>
          ))}
        </select>
      </TableCell>
      {Array.from({ length: teamCount }, (_, i) => {
        const t = teams[i]
        const isValid = t.placement !== '' && t.kills !== ''
        return (
          <TableCell key={i} className="text-right">
            {t.editing ? (
              <div className="flex items-center gap-1 justify-end">
                <Input
                  type="number"
                  min={1}
                  max={64}
                  placeholder="순위"
                  value={t.placement}
                  onChange={(e) => setTeam(i, { placement: e.target.value })}
                  className="w-14 h-7 text-xs text-center px-1"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="킬"
                  value={t.kills}
                  onChange={(e) => setTeam(i, { kills: e.target.value })}
                  className="w-14 h-7 text-xs text-center px-1"
                />
                <Button
                  size="sm"
                  disabled={!isValid || t.saving}
                  onClick={() => handleSave(i)}
                  className="h-7 w-7 p-0 bg-yellow-400 text-black hover:bg-yellow-300 shrink-0"
                >
                  {t.saving ? '…' : <Check className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 justify-end">
                <span className={`text-xs ${TEAM_COLORS[i]}`}>
                  {t.placement}위·{t.kills}킬
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-muted-foreground"
                  onClick={() => setTeam(i, { editing: true })}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </TableCell>
        )
      })}
      <TableCell />
    </TableRow>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
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
  const [currentRuleKey, setCurrentRuleKey] = useState<ScoringRuleKey>(scoringRuleKey)
  const rule = rules[currentRuleKey]
  const [editingRound, setEditingRound] = useState<RoundResult | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [ruleChanging, setRuleChanging] = useState(false)

  // 라운드 관리 상태
  const allNumbers = new Set(rounds.map((r) => r.round_number))
  const incompleteNumbers = new Set(
    rounds.filter((r) => !isRoundComplete(r, teamCount)).map((r) => r.round_number)
  )
  const nextDefault = Math.max(...[...allNumbers], 0) + 1

  const [shownRounds, setShownRounds] = useState<number[]>(() =>
    incompleteNumbers.size > 0
      ? [...incompleteNumbers]
      : nextDefault <= MAX_ROUNDS
      ? [nextDefault]
      : []
  )

  const pendingNumbers = shownRounds.filter((n) => !allNumbers.has(n))
  const allRowNumbers = [...new Set([...allNumbers, ...pendingNumbers])].sort((a, b) => a - b)
  const nextToAdd = Math.max(...allRowNumbers, 0) + 1
  const canAdd = !isDone && nextToAdd <= MAX_ROUNDS

  // 점수 계산
  const totals = [0, 0, 0]
  const scoreMap = new Map<number, (number | null)[]>()
  for (const r of rounds) {
    const complete = isRoundComplete(r, teamCount)
    const scores = [
      r.team1_placement != null ? calcTeamScore(rule, r.team1_placement, r.team1_kills ?? 0) : null,
      r.team2_placement != null ? calcTeamScore(rule, r.team2_placement, r.team2_kills ?? 0) : null,
      teamCount === 3 && r.team3_placement != null
        ? calcTeamScore(rule, r.team3_placement, r.team3_kills ?? 0)
        : null,
    ]
    if (complete) scores.forEach((s, i) => { if (s !== null) totals[i] += s })
    scoreMap.set(r.round_number, scores)
  }
  const winnerIdx = totals.slice(0, teamCount).indexOf(Math.max(...totals.slice(0, teamCount)))

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

        <CardContent className="space-y-3">
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
              {allRowNumbers.map((n) => {
                const round = rounds.find((r) => r.round_number === n)
                const complete = round ? isRoundComplete(round, teamCount) : false

                if (isDone || (round && complete)) {
                  // 완료된 행
                  const scores = scoreMap.get(n) ?? []
                  const teamData = round ? [
                    { placement: round.team1_placement, kills: round.team1_kills },
                    { placement: round.team2_placement, kills: round.team2_kills },
                    { placement: round.team3_placement ?? null, kills: round.team3_kills ?? null },
                  ] : []
                  return (
                    <TableRow key={n}>
                      <TableCell className="font-medium">{n}R</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {round?.map_name ?? '-'}
                      </TableCell>
                      {scores.slice(0, teamCount).map((s, i) => (
                        <TableCell key={i} className="text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span>{s ?? '-'}</span>
                            {teamData[i]?.placement != null && (
                              <span className="text-[10px] text-muted-foreground">
                                {teamData[i].placement}위·{teamData[i].kills ?? 0}킬
                              </span>
                            )}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        {!isDone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground h-6 px-2"
                            onClick={() => round && setEditingRound(round)}
                          >
                            수정
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                }

                // 진행 중 / 신규 행
                return (
                  <EditableRoundRow
                    key={n}
                    roomId={roomId}
                    roundNumber={n}
                    teamCount={teamCount}
                    existingData={round}
                  />
                )
              })}

              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={2}>합계</TableCell>
                {totals.slice(0, teamCount).map((t, i) => (
                  <TableCell
                    key={i}
                    className={`text-right ${i === winnerIdx && t > 0 ? 'text-yellow-400' : ''}`}
                  >
                    {t}점 {i === winnerIdx && t > 0 ? '🏆' : ''}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>

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
