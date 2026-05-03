'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addPlayer } from '@/app/actions/player'

export function AddPlayerForm() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return

    setLoading(true)
    try {
      const player = await addPlayer(nickname.trim())
      toast.success(`${player.pubg_nickname} 추가 완료 — ${player.tier}티어`)
      setNickname('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '추가 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <Input
        placeholder="PUBG 닉네임 입력"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        disabled={loading}
      />
      <Button
        type="submit"
        disabled={loading || !nickname.trim()}
        className="bg-yellow-400 text-black hover:bg-yellow-300 shrink-0"
      >
        {loading ? '조회 중...' : '추가'}
      </Button>
    </form>
  )
}
