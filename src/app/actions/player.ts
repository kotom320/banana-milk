'use server'

import { createClient } from '@/lib/supabase/server'
import { calcPlayStyle, calcTier, getRecentMatchStats } from '@/lib/pubg'
import { revalidatePath } from 'next/cache'

export async function addPlayer(nickname: string) {
  const stats = await getRecentMatchStats(nickname)
  const tier = calcTier(stats.avgDamage, stats.avgKills)
  const playstyle = calcPlayStyle(stats.avgDamage, stats.avgKills, stats.avgSurvivalTime)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .upsert(
      {
        pubg_nickname: stats.nickname,
        tier,
        playstyle,
        avg_damage: stats.avgDamage,
        avg_kills: stats.avgKills,
        avg_survival_time: stats.avgSurvivalTime,
        matches_analyzed: stats.matches.length,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: 'pubg_nickname' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/players')
  return data
}

export async function refreshPlayer(playerId: string, nickname: string) {
  const stats = await getRecentMatchStats(nickname)
  const tier = calcTier(stats.avgDamage, stats.avgKills)
  const playstyle = calcPlayStyle(stats.avgDamage, stats.avgKills, stats.avgSurvivalTime)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .update({
      tier,
      playstyle,
      avg_damage: stats.avgDamage,
      avg_kills: stats.avgKills,
      avg_survival_time: stats.avgSurvivalTime,
      matches_analyzed: stats.matches.length,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/players')
  return data
}

export async function deletePlayer(playerId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw new Error(error.message)
  revalidatePath('/players')
}
