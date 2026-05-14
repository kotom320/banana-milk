'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const ROOM_MUTATED_EVENT = (roomId: string) => `room-mutated:${roomId}`

/** 변경을 일으킨 탭에서 호출 — RealtimeSync가 이를 받아 다른 클라이언트에 broadcast */
export function notifyRoomMutation(roomId: string) {
  window.dispatchEvent(new Event(ROOM_MUTATED_EVENT(roomId)))
}

export function RealtimeSync({ roomId }: { roomId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'refresh' }, () => router.refresh())
      .subscribe()

    function onLocalMutation() {
      channel.send({ type: 'broadcast', event: 'refresh', payload: {} })
    }

    window.addEventListener(ROOM_MUTATED_EVENT(roomId), onLocalMutation)

    return () => {
      window.removeEventListener(ROOM_MUTATED_EVENT(roomId), onLocalMutation)
      supabase.removeChannel(channel)
    }
  }, [roomId, router])

  return null
}
