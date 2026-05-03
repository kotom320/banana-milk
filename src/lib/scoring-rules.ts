export type ScoringRuleKey = 'standard' | 'kill_focused' | 'survival' | 'competitive'

export interface ScoringRule {
  key: ScoringRuleKey
  name: string
  description: string
  placements: number[] // index 0 = 1위, index 1 = 2위, ...
  killPoint: number
}

export const SCORING_RULES: Record<ScoringRuleKey, ScoringRule> = {
  standard: {
    key: 'standard',
    name: '기본 내전룰',
    description: '1위 10점 · 킬당 1점',
    placements: [10, 6, 5, 4, 3, 2, 2, 2, 2, 2], // 11위 이하 = 1점
    killPoint: 1,
  },
  kill_focused: {
    key: 'kill_focused',
    name: '킬 특화',
    description: '1위 10점 · 킬당 2점',
    placements: [10, 6, 5, 4, 3, 2, 2, 2, 2, 2],
    killPoint: 2,
  },
  survival: {
    key: 'survival',
    name: '생존 중심',
    description: '순위점수만 · 킬 없음',
    placements: [10, 6, 5, 4, 3, 2, 2, 2, 2, 2],
    killPoint: 0,
  },
  competitive: {
    key: 'competitive',
    name: 'PCS 대회룰',
    description: '1위 12점 · 킬당 1점',
    placements: [12, 9, 7, 5, 4, 3, 2, 1, 0, 0],
    killPoint: 1,
  },
}

export function getPlacementScoreByRule(rule: ScoringRule, place: number): number {
  if (place <= 0) return 0
  return rule.placements[place - 1] ?? 1
}

export function calcTeamScore(
  rule: ScoringRule,
  placement: number,
  kills: number
): number {
  return getPlacementScoreByRule(rule, placement) + kills * rule.killPoint
}
