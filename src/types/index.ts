export type Tier = 1 | 2 | 3 | 4

export type PlayStyle =
  | '공격형 캐리'
  | '단기결전형'
  | '치킨런너'
  | '올라운더'
  | '서포터형'
  | '분석불가'

export interface Player {
  id: string
  pubg_nickname: string
  tier: Tier
  playstyle: PlayStyle
  avg_damage: number
  avg_kills: number
  avg_survival_time: number // 초 단위
  matches_analyzed: number
  custom_score: number | null
  last_updated_at: string
  created_at: string
}

export type TeamMethod = 'balanced' | 'random' | 'tier_shuffle' | 'custom_score'

export interface Room {
  id: string
  title: string
  team_count: 2 | 3
  status: 'waiting' | 'in_progress' | 'done'
  scoring_rule: 'standard' | 'kill_focused' | 'survival' | 'competitive'
  team_method: TeamMethod
  winner_team: 1 | 2 | 3 | null
  created_at: string
}

export interface RoomPlayer {
  id: string
  room_id: string
  player_id: string
  team_number: 1 | 2 | 3
  player?: Player
}

export interface RoundResult {
  id: string
  room_id: string
  round_number: number
  map_name: string
  team1_placement: number
  team1_kills: number
  team2_placement: number
  team2_kills: number
  team3_placement?: number
  team3_kills?: number
  created_at: string
}

export interface RoomWithPlayers extends Room {
  room_players: (RoomPlayer & { player: Player })[]
  round_results: RoundResult[]
}

// PUBG API 관련
export interface PubgMatchStats {
  damage: number
  kills: number
  survivalTime: number
  winPlace: number
}

export interface PubgPlayerStats {
  nickname: string
  matches: PubgMatchStats[]
  avgDamage: number
  avgKills: number
  avgSurvivalTime: number
}
