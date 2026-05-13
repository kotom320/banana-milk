'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ScoringRuleKey } from '@/lib/scoring-rules'

export async function updateScoringRuleConfig(
  key: ScoringRuleKey,
  name: string,
  description: string,
  placements: number[],
  killPoint: number
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scoring_rule_configs')
    .upsert({
      key,
      name,
      description,
      placements,
      kill_point: killPoint,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/rooms', 'layout')
}

export async function resetScoringRuleConfig(key: ScoringRuleKey) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scoring_rule_configs')
    .delete()
    .eq('key', key)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/rooms', 'layout')
}
