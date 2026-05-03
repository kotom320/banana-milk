import { createClient } from '@/lib/supabase/server'
import { Player } from '@/types'
import { CreateRoomForm } from './create-room-form'

export default async function NewRoomPage() {
  const supabase = await createClient()
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .order('tier', { ascending: true })
    .order('avg_damage', { ascending: false })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">내전 만들기</h1>
        <p className="text-muted-foreground text-sm mt-1">
          참가 인원을 선택하면 티어 기반으로 팀을 자동 배분합니다.
        </p>
      </div>

      <CreateRoomForm players={(players ?? []) as Player[]} />
    </div>
  )
}
