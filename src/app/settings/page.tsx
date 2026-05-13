import { createClient } from '@/lib/supabase/server'
import { SCORING_RULES, ScoringRuleKey, dbRowToScoringRule } from '@/lib/scoring-rules'
import { RuleEditForm } from './rule-edit-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase.from('scoring_rule_configs').select('*')

  const customizedKeys = new Set((rows ?? []).map((r) => r.key))

  const rules = (Object.keys(SCORING_RULES) as ScoringRuleKey[]).map((key) => {
    const row = (rows ?? []).find((r) => r.key === key)
    return {
      rule: row ? dbRowToScoringRule(row) : SCORING_RULES[key],
      isCustomized: customizedKeys.has(key),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground text-sm mt-1">
          점수 규칙을 수정하면 모든 방에 즉시 반영됩니다.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">점수 규칙 편집</h2>
        {rules.map(({ rule, isCustomized }) => (
          <RuleEditForm key={rule.key} rule={rule} isCustomized={isCustomized} />
        ))}
      </section>
    </div>
  )
}
