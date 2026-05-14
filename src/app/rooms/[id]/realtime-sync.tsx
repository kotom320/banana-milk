'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeSync({ roomId }: { roomId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    function onRoomChange(payload: Record<string, unknown>) {
      const row = (payload.new ?? payload.old) as Record<string, unknown> | null
      const id = row?.room_id ?? row?.id
      if (!id || id === roomId) router.refresh()
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players' }, onRoomChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'round_results' }, onRoomChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, onRoomChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, router])

  return null
}
