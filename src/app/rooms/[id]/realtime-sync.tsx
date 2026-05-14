'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeSync({ roomId }: { roomId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_results', filter: `room_id=eq.${roomId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => router.refresh()
      )
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] error:', err)
        else console.log('[Realtime] status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, router])

  return null
}
