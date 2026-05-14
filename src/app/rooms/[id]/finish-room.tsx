'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { finishRoom } from '@/app/actions/room'

const TEAM_LABELS = ['Team 1', 'Team 2', 'Team 3']
const TEAM_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400']
const TEAM_BORDER = ['border-red-500', 'border-blue-500', 'border-green-500']

export function FinishRoom({
  roomId,
  teamCount,
  scores,
}: {
  roomId: string
  teamCount: 2 | 3
  scores: number[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const maxScore = Math.max(...scores.slice(0, teamCount))
  const suggestedWinner = (scores.slice(0, teamCount).indexOf(maxScore) + 1) as 1 | 2 | 3

  async function handleFinish(winner: 1 | 2 | 3) {
    setLoading(true)
    try {
      await finishRoom(roomId, winner)
      toast.success('내전이 종료되었습니다!')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '종료 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        onClick={() => setOpen(true)}
      >
        내전 종료
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>내전 종료 — 우승팀 선택</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            현재 점수 기준 추천 우승팀이 표시됩니다. 직접 선택할 수 있습니다.
          </p>
          <div className={`grid gap-3 ${teamCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Array.from({ length: teamCount }, (_, i) => {
              const teamNum = (i + 1) as 1 | 2 | 3
              const isSuggested = teamNum === suggestedWinner
              return (
                <button
                  key={teamNum}
                  disabled={loading}
                  onClick={() => handleFinish(teamNum)}
                  className={`flex flex-col items-center gap-1 px-4 py-4 rounded-lg border-2 transition-colors disabled:opacity-50
                    ${isSuggested
                      ? `${TEAM_BORDER[i]} bg-yellow-400/5`
                      : 'border-border hover:border-foreground/40'
                    }`}
                >
                  <span className={`text-lg font-bold ${TEAM_COLORS[i]}`}>
                    {TEAM_LABELS[i]}
                  </span>
                  <span className="text-2xl font-bold">{scores[i]}점</span>
                  {isSuggested && (
                    <span className="text-xs text-yellow-400 font-medium">추천 🏆</span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
