import { Player, Tier } from '@/types'

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

// Snake Draft 방식으로 팀 배분
export function balanceTeams(
  players: Player[],
  teamCount: 2 | 3
): TeamAssignment {
  const sorted = [...players].sort(
    (a, b) => TIER_SCORE[b.tier] - TIER_SCORE[a.tier]
  )

  const teams: Player[][] = Array.from({ length: teamCount }, () => [])

  sorted.forEach((player, index) => {
    const cycle = Math.floor(index / teamCount)
    const posInCycle = index % teamCount
    // Snake: 짝수 사이클은 정방향, 홀수 사이클은 역방향
    const teamIndex =
      cycle % 2 === 0 ? posInCycle : teamCount - 1 - posInCycle
    teams[teamIndex].push(player)
  })

  const scores = teams.map((t) =>
    t.reduce((sum, p) => sum + TIER_SCORE[p.tier], 0)
  )
  const scoreDiff = Math.max(...scores) - Math.min(...scores)

  return {
    team1: teams[0],
    team2: teams[1],
    team3: teams[2],
    scoreDiff,
  }
}

export function getTierScore(tier: Tier): number {
  return TIER_SCORE[tier]
}

// 티어별 킬 가중치 (내전 점수용)
export function getKillWeight(tier: Tier): number {
  const weights: Record<Tier, number> = {
    1: 0.5,
    2: 1.0,
    3: 1.5,
    4: 2.0,
  }
  return weights[tier]
}

// 순위별 팀 점수
export function getPlacementScore(place: number): number {
  if (place === 1) return 10
  if (place === 2) return 6
  if (place === 3) return 5
  if (place === 4) return 4
  if (place === 5) return 3
  if (place <= 10) return 2
  return 1
}
