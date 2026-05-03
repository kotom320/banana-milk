import { createClient } from '@/lib/supabase/server'
import { Player } from '@/types'
import { AddPlayerForm } from './add-player-form'
import { PlayerTable } from './player-table'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .order('tier', { ascending: true })
    .order('avg_damage', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">플레이어 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          PUBG 닉네임을 추가하면 최근 전적을 분석해 티어를 자동 산정합니다.
        </p>
      </div>

      <AddPlayerForm />

      <PlayerTable players={(players ?? []) as Player[]} />
    </div>
  )
}
