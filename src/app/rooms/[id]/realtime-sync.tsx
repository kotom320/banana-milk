'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const ROOM_MUTATED_EVENT = (roomId: string) => `room-mutated:${roomId}`

/** 변경을 일으킨 탭에서 호출 — RealtimeSync가 이를 받아 다른 클라이언트에 broadcast */
export function notifyRoomMutation(roomId: string) {
  window.dispatchEvent(new Event(ROOM_MUTATED_EVENT(roomId)))
}

export function RealtimeSync({ roomId }: { roomId: string }) {
  const router = useRouter()
  const routerRef = useRef(router)

  // router 레퍼런스를 ref에 동기화 (deps 없이 항상 최신 유지)
  useEffect(() => {
    routerRef.current = router
  })

  useEffect(() => {
    const supabase = createClient()
    let subscribed = false
    let pending = false

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'refresh' }, () => routerRef.current.refresh())
      .subscribe((status) => {
        subscribed = status === 'SUBSCRIBED'
        if (subscribed && pending) {
          pending = false
          channel.send({ type: 'broadcast', event: 'refresh', payload: {} })
        }
      })

    function onLocalMutation() {
      if (subscribed) {
        channel.send({ type: 'broadcast', event: 'refresh', payload: {} })
      } else {
        // 아직 연결 중이면 구독 완료 후 한 번만 보냄
        pending = true
      }
    }

    window.addEventListener(ROOM_MUTATED_EVENT(roomId), onLocalMutation)

    return () => {
      window.removeEventListener(ROOM_MUTATED_EVENT(roomId), onLocalMutation)
      supabase.removeChannel(channel)
    }
  }, [roomId]) // router를 deps에서 제거 — router.refresh() 이후 채널이 재생성되는 문제 방지

  return null
}
