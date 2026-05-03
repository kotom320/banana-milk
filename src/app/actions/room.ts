'use server'

import { createClient } from '@/lib/supabase/server'
import { getPlacementScore } from '@/lib/team-balancer'
import { revalidatePath } from 'next/cache'

export async function createRoom(
  title: string,
  teamCount: 2 | 3,
  playerIds: string[]
) {
  const supabase = await createClient()

  // 1. 플레이어 조회 및 팀 배분
  const { data: players, error: pErr } = await supabase
    .from('players')
    .select('*')
    .in('id', playerIds)

  if (pErr || !players) throw new Error('플레이어 조회 실패')

  // 동적 import로 서버 사이드에서만 사용
  const { balanceTeams } = await import('@/lib/team-balancer')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignment = balanceTeams(players as any, teamCount)

  // 2. room 생성
  const { data: room, error: rErr } = await supabase
    .from('rooms')
    .insert({ title, team_count: teamCount })
    .select()
    .single()

  if (rErr || !room) throw new Error('방 생성 실패')

  // 3. room_players 삽입
  const teamMap = [
    ...(assignment.team1?.map((p) => ({ player: p, team: 1 })) ?? []),
    ...(assignment.team2?.map((p) => ({ player: p, team: 2 })) ?? []),
    ...(assignment.team3?.map((p) => ({ player: p, team: 3 })) ?? []),
  ]

  const roomPlayers = teamMap.map(({ player, team }) => ({
    room_id: room.id,
    player_id: player.id,
    team_number: team,
  }))

  const { error: rpErr } = await supabase.from('room_players').insert(roomPlayers)
  if (rpErr) throw new Error('팀 배정 저장 실패')

  revalidatePath('/rooms')
  return room
}

export async function submitRoundResult(
  roomId: string,
  roundNumber: number,
  results: {
    team1Placement: number
    team1Kills: number
    team2Placement: number
    team2Kills: number
    team3Placement?: number
    team3Kills?: number
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.from('round_results').upsert({
    room_id: roomId,
    round_number: roundNumber,
    team1_placement: results.team1Placement,
    team1_kills: results.team1Kills,
    team2_placement: results.team2Placement,
    team2_kills: results.team2Kills,
    team3_placement: results.team3Placement ?? null,
    team3_kills: results.team3Kills ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/rooms/${roomId}`)
}

export async function updateRoomStatus(
  roomId: string,
  status: 'waiting' | 'in_progress' | 'done'
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', roomId)
  if (error) throw new Error(error.message)
  revalidatePath(`/rooms/${roomId}`)
}

// 누적 점수 계산 (기본 순위점수 + 킬점수, 티어 가중치 없음 - 팀 단위이므로)
export function calcRoundScores(results: {
  team1Placement: number
  team1Kills: number
  team2Placement: number
  team2Kills: number
  team3Placement?: number
  team3Kills?: number
}) {
  return {
    team1: getPlacementScore(results.team1Placement) + results.team1Kills,
    team2: getPlacementScore(results.team2Placement) + results.team2Kills,
    team3:
      results.team3Placement !== undefined
        ? getPlacementScore(results.team3Placement) + (results.team3Kills ?? 0)
        : undefined,
  }
}
