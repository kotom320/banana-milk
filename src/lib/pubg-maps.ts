export const PUBG_MAPS = [
  '에란겔',
  '미라마',
  '사녹',
  '비켄디',
  '태이고',
  '데스턴',
  '론도',
] as const

export type PubgMap = (typeof PUBG_MAPS)[number]
