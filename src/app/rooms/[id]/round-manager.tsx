'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoundInput } from './round-input'
import { RoundResult } from '@/types'

const MAX_ROUNDS = 10

export function RoundManager({
  roomId,
  teamCount,
  allRounds,
}: {
  roomId: string
  teamCount: 2 | 3
  allRounds: RoundResult[]
}) {
  const incompleteRounds = allRounds.filter(
    (r) =>
      r.team1_placement == null ||
      r.team2_placement == null ||
      (teamCount === 3 && r.team3_placement == null)
  )
  const incompleteNumbers = new Set(incompleteRounds.map((r) => r.round_number))
  const allNumbers = new Set(allRounds.map((r) => r.round_number))

  const nextDefault = Math.max(...[...allNumbers], 0) + 1

  const [shownRounds, setShownRounds] = useState<number[]>(() =>
    incompleteRounds.length > 0
      ? incompleteRounds.map((r) => r.round_number)
      : nextDefault <= MAX_ROUNDS
      ? [nextDefault]
      : []
  )

  // Merge: shown list ∪ currently incomplete in DB, minus complete rounds
  const merged = [...new Set([...shownRounds, ...incompleteNumbers])]
    .filter((n) => !allNumbers.has(n) || incompleteNumbers.has(n))
    .sort((a, b) => a - b)

  const nextToAdd = Math.max(...merged, ...[...allNumbers], 0) + 1
  const canAdd = nextToAdd <= MAX_ROUNDS

  function addRound() {
    setShownRounds((prev) => [...prev, nextToAdd])
  }

  return (
    <div className="space-y-4">
      {merged.map((n) => (
        <RoundInput
          key={n}
          roomId={roomId}
          roundNumber={n}
          teamCount={teamCount}
          existingData={incompleteRounds.find((r) => r.round_number === n)}
        />
      ))}
      {canAdd && (
        <Button
          variant="outline"
          className="w-full border-dashed text-muted-foreground gap-1.5"
          onClick={addRound}
        >
          <Plus className="w-3.5 h-3.5" />
          {nextToAdd}라운드 추가
        </Button>
      )}
    </div>
  )
}
