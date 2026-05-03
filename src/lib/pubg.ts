import { PlayStyle, PubgMatchStats, PubgPlayerStats, Tier } from '@/types'

const PUBG_API_BASE = 'https://api.pubg.com/shards/steam'

async function fetchPubg(path: string) {
  const res = await fetch(`${PUBG_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.PUBG_API_KEY}`,
      Accept: 'application/vnd.api+json',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PUBG API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function getPlayerByNickname(nickname: string) {
  const data = await fetchPubg(
    `/players?filter[playerNames]=${encodeURIComponent(nickname)}`
  )
  const player = data.data?.[0]
  if (!player) throw new Error(`플레이어를 찾을 수 없습니다: ${nickname}`)
  return player
}

export async function getRecentMatchStats(
  nickname: string
): Promise<PubgPlayerStats> {
  const player = await getPlayerByNickname(nickname)

  const matchIds: string[] =
    player.relationships?.matches?.data?.slice(0, 14).map((m: { id: string }) => m.id) ?? []

  if (matchIds.length === 0) {
    throw new Error('최근 매치 데이터가 없습니다.')
  }

  const matchResults = await Promise.allSettled(
    matchIds.map((id) => fetchPubg(`/matches/${id}`))
  )

  const stats: PubgMatchStats[] = []

  for (const result of matchResults) {
    if (result.status !== 'fulfilled') continue

    const matchData = result.value
    const participants: Array<{ attributes: { stats: Record<string, unknown> } }> =
      matchData.included?.filter(
        (item: { type: string }) => item.type === 'participant'
      ) ?? []

    const me = participants.find(
      (p) =>
        (p.attributes.stats as { name: string }).name?.toLowerCase() ===
        nickname.toLowerCase()
    )

    if (!me) continue

    const s = me.attributes.stats as {
      damageDealt: number
      kills: number
      timeSurvived: number
      winPlace: number
    }

    stats.push({
      damage: Math.round(s.damageDealt),
      kills: s.kills,
      survivalTime: Math.round(s.timeSurvived),
      winPlace: s.winPlace,
    })
  }

  if (stats.length === 0) {
    throw new Error('분석 가능한 매치 데이터가 없습니다.')
  }

  const avgDamage = Math.round(stats.reduce((s, m) => s + m.damage, 0) / stats.length)
  const avgKills = Math.round((stats.reduce((s, m) => s + m.kills, 0) / stats.length) * 10) / 10
  const avgSurvivalTime = Math.round(stats.reduce((s, m) => s + m.survivalTime, 0) / stats.length)

  return { nickname, matches: stats, avgDamage, avgKills, avgSurvivalTime }
}

export function calcTier(avgDamage: number, avgKills: number): Tier {
  const score = avgDamage * 0.7 + avgKills * 80 * 0.3

  if (score >= 350) return 1
  if (score >= 220) return 2
  if (score >= 120) return 3
  return 4
}

export function calcPlayStyle(
  avgDamage: number,
  avgKills: number,
  avgSurvivalTime: number
): PlayStyle {
  const damagePerMinute = avgDamage / (avgSurvivalTime / 60)

  if (avgDamage >= 400 && avgKills >= 2.5) return '공격형 캐리'
  if (damagePerMinute >= 30 && avgSurvivalTime < 1200) return '단기결전형'
  if (avgSurvivalTime >= 1500 && avgDamage < 200) return '치킨런너'
  if (avgDamage >= 250 && avgKills >= 1.5) return '올라운더'
  if (avgDamage < 150) return '서포터형'
  return '올라운더'
}
