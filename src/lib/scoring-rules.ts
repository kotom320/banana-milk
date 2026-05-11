export type ScoringRuleKey = 'standard' | 'kill_focused' | 'survival' | 'competitive'

export interface ScoringRule {
  key: ScoringRuleKey
  name: string
  description: string
  tooltip: string
  placements: number[] // index 0 = 1위, index 1 = 2위, ...
  killPoint: number
}

export const SCORING_RULES: Record<ScoringRuleKey, ScoringRule> = {
  standard: {
    key: 'standard',
    name: '기본 내전룰',
    description: '1위 8점 · 킬당 1점',
    tooltip: '우리 내전 기본 룰\n\n순위: 1위 8점 · 2위 4점 · 3위 3점\n4위 2점 · 5위↓ 1점\n킬: 1킬당 1점\n\n킬과 생존 둘 다 중요한 밸런스형',
    placements: [8, 4, 3, 2, 1, 1, 1, 1, 1, 1],
    killPoint: 1,
  },
  kill_focused: {
    key: 'kill_focused',
    name: '킬 특화',
    description: '1위 8점 · 킬당 2점',
    tooltip: '킬이 더 중요한 공격적인 룰\n\n순위: 기본 내전룰과 동일\n킬: 1킬당 2점 (기본의 2배)\n\n공격형 캐리 플레이어에게 유리.\n치킨만 노리는 전략은 불리함',
    placements: [8, 4, 3, 2, 1, 1, 1, 1, 1, 1],
    killPoint: 2,
  },
  survival: {
    key: 'survival',
    name: '생존 중심',
    description: '순위점수만 · 킬 없음',
    tooltip: '오직 생존 순위만으로 승부\n\n순위: 기본 내전룰과 동일\n킬: 점수 없음\n\n무리한 교전보다 존버 전략이 유리.\n치킨런너 타입에게 좋은 환경',
    placements: [8, 4, 3, 2, 1, 1, 1, 1, 1, 1],
    killPoint: 0,
  },
  competitive: {
    key: 'competitive',
    name: 'PCS 대회룰',
    description: '1위 12점 · 킬당 1점',
    tooltip: 'PUBG 공식 PCS 대회 방식\n\n순위: 1위 12점 · 2위 9점 · 3위 7점\n4위 5점 · 5위 4점 · 6위 3점 · 7위 2점\n8위 1점 · 9위↓ 0점\n킬: 1킬당 1점\n\n1위 프리미엄이 크고 하위권은 0점.\n실력 차이가 잘 드러나는 룰',
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
