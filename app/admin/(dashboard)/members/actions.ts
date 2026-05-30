'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Member = {
  id: string
  email: string
  name: string | null
  role: string
  points: number
  created_at: string
}

export type PointHistoryEntry = {
  id: string
  delta: number
  balance_after: number
  reason: string
  source: string
  order_id: string | null
  created_at: string
}

export async function getMembers(search?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, name, role, points, created_at')
    .order('created_at', { ascending: false })

  if (search?.trim()) {
    query = query.ilike('email', `%${search.trim()}%`)
  }

  const { data } = await query
  return (data ?? []) as Member[]
}

/**
 * 관리자가 회원 포인트를 수동 조정.
 * delta 양수 = 지급, 음수 = 회수.
 * 결과 잔액이 음수가 되지 않도록 cap.
 */
export async function adjustMemberPoints(memberId: string, delta: number, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  if (!Number.isInteger(delta) || delta === 0) {
    return { error: '조정 금액을 입력해주세요.' }
  }
  if (!reason.trim()) {
    return { error: '조정 사유를 입력해주세요.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', memberId)
    .single()
  if (!profile) return { error: '회원을 찾을 수 없습니다.' }

  const newBalance = (profile.points ?? 0) + delta
  if (newBalance < 0) {
    return { error: `잔액이 부족합니다. (보유 ${profile.points.toLocaleString()}P, 차감 ${Math.abs(delta).toLocaleString()}P)` }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: newBalance })
    .eq('id', memberId)
  if (updateError) return { error: `포인트 변경 실패: ${updateError.message}` }

  await supabase.from('point_history').insert({
    user_id: memberId,
    delta,
    balance_after: newBalance,
    reason: reason.trim(),
    source: delta > 0 ? 'admin_grant' : 'admin_revoke',
    created_by: user.id,
  })

  revalidatePath('/admin/members')
  return { success: true, newBalance }
}

export async function getMemberPointHistory(memberId: string, limit = 50): Promise<PointHistoryEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('point_history')
    .select('id, delta, balance_after, reason, source, order_id, created_at')
    .eq('user_id', memberId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as PointHistoryEntry[]
}

export async function updateMemberRole(id: string, role: 'admin' | 'user') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)

  if (error) {
    return { error: '역할 변경 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: '회원 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/members')
  return { success: true }
}
