import { Player, TeamMethod, Tier } from '@/types'

const TIER_SCORE: Record<Tier, number> = {
  1: 100,
  2: 70,
  3: 40,
  4: 15,
}

export interface TeamAssignment {
  team1: Player[]
  team2: Player[]
  team3?: Player[]
  scoreDiff: number
}

export const TEAM_METHODS: Record<TeamMethod, { name: string; description: string; tooltip: string }> = {
  balanced: {
    name: '밸런스',
    description: '티어 기반 Snake Draft',
    tooltip: '티어 점수 기준으로 정렬 후 Snake Draft 방식으로 배분\n\n예) 6명 2팀:\n강-강-약-약-중-중 → A팀: 강·약·중 / B팀: 강·약·중\n\n가장 공정한 팀 구성 방법',
  },
  tier_shuffle: {
    name: '티어 섞기',
    description: '같은 티어 내 랜덤 + Snake Draft',
    tooltip: '같은 티어 플레이어끼리 순서를 섞은 뒤 Snake Draft 적용\n\n밸런스를 유지하면서 매번 다른 팀 구성.\n"항상 같은 팀"이 되는 것을 방지할 때 유용',
  },
  random: {
    name: '완전 랜덤',
    description: '순서 무작위 배정',
    tooltip: '모든 플레이어를 무작위로 섞어 팀에 배정\n\n티어 무관 완전 랜덤.\n운빨 내전을 원할 때 사용',
  },
  custom_score: {
    name: '커스텀 점수',
    description: '개인 점수 기반 Snake Draft',
    tooltip: '플레이어 관리에서 직접 입력한 커스텀 점수 기반 배분\n\nPUBG 전적 티어와 무관하게 우리만의 기준으로 점수를 부여하고 팀을 나눕니다.\n\n커스텀 점수 미입력 시 티어 점수로 대체',
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function snakeDraft(players: Player[], teamCount: 2 | 3): Player[][] {
  const teams: Player[][] = Array.from({ length: teamCount }, () => [])
  players.forEach((player, index) => {
    const cycle = Math.floor(index / teamCount)
    const posInCycle = index % teamCount
    const teamIndex = cycle % 2 === 0 ? posInCycle : teamCount - 1 - posInCycle
    teams[teamIndex].push(player)
  })
  return teams
}

function toAssignment(teams: Player[][]): TeamAssignment {
  const scores = teams.map((t) => t.reduce((sum, p) => sum + getEffectiveScore(p), 0))
  return {
    team1: teams[0] ?? [],
    team2: teams[1] ?? [],
    team3: teams[2],
    scoreDiff: Math.max(...scores) - Math.min(...scores),
  }
}

export function getEffectiveScore(player: Player): number {
  return player.custom_score ?? TIER_SCORE[player.tier]
}

export function assignTeams(
  players: Player[],
  teamCount: 2 | 3,
  method: TeamMethod
): TeamAssignment {
  if (method === 'random') {
    const shuffled = shuffle(players)
    const teams: Player[][] = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((p, i) => teams[i % teamCount].push(p))
    return toAssignment(teams)
  }

  if (method === 'tier_shuffle') {
    const byTier: Record<number, Player[]> = {}
    players.forEach((p) => {
      if (!byTier[p.tier]) byTier[p.tier] = []
      byTier[p.tier].push(p)
    })
    const sorted = [1, 2, 3, 4].flatMap((tier) => shuffle(byTier[tier] ?? []))
    return toAssignment(snakeDraft(sorted, teamCount))
  }

  if (method === 'custom_score') {
    // 커스텀 점수 기반 정렬 (없으면 티어 점수 대체)
    const sorted = [...players].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a))
    return toAssignment(snakeDraft(sorted, teamCount))
  }

  // balanced: 티어 점수 내림차순 정렬 후 Snake Draft
  const sorted = [...players].sort((a, b) => TIER_SCORE[b.tier] - TIER_SCORE[a.tier])
  return toAssignment(snakeDraft(sorted, teamCount))
}

// 하위 호환
export function balanceTeams(players: Player[], teamCount: 2 | 3): TeamAssignment {
  return assignTeams(players, teamCount, 'balanced')
}

export function getTierScore(tier: Tier): number {
  return TIER_SCORE[tier]
}

export function getKillWeight(tier: Tier): number {
  return { 1: 0.5, 2: 1.0, 3: 1.5, 4: 2.0 }[tier]
}

export function getPlacementScore(place: number): number {
  if (place === 1) return 10
  if (place === 2) return 6
  if (place === 3) return 5
  if (place === 4) return 4
  if (place === 5) return 3
  if (place <= 10) return 2
  return 1
}
