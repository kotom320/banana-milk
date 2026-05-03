'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitRoundResult, RoundResultInput } from '@/app/actions/room'
import { RoundForm } from './round-form'

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
  const [loading, setLoading] = useState(false)

  async function handleSubmit(data: RoundResultInput) {
    setLoading(true)
    try {
      await submitRoundResult(roomId, roundNumber, data)
      toast.success(`${roundNumber}라운드 결과 기록 완료`)
      router.refresh()
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
        <RoundForm
          teamCount={teamCount}
          submitLabel={`${roundNumber}라운드 기록`}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  )
}
