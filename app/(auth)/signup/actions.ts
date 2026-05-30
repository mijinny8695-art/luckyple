'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMemberSettings } from '@/lib/member-settings'
import { FIELD_ORDER, type FieldKey } from '@/app/admin/(dashboard)/members/settings/config'

function pickStr(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const settings = await getCurrentMemberSettings()

  if (!settings.login_enabled) {
    return { error: '현재 회원가입이 비활성화되어 있습니다.' }
  }

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  if (password !== confirmPassword) return { error: '비밀번호가 일치하지 않습니다.' }
  if (password.length < 6) return { error: '비밀번호는 최소 6자 이상이어야 합니다.' }

  const email = formData.get('email') as string
  const name = pickStr(formData, 'name')
  if (!name) return { error: '이름을 입력해주세요.' }

  // 활성 + 필수인 추가 필드 검증
  for (const k of FIELD_ORDER) {
    if (k === 'name') continue
    const f = settings.signup_fields[k]
    if (f.use && f.required && !pickStr(formData, k)) {
      return { error: `${LABEL[k]}을(를) 입력해주세요.` }
    }
  }

  const { data: signUpData, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return { error: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  if (signUpData.user) {
    const update: Record<string, string | null> = { name }
    for (const k of FIELD_ORDER) {
      if (k === 'name') continue
      if (!settings.signup_fields[k].use) continue
      const v = pickStr(formData, k)
      update[k] = v || null
    }
    // 주소 사용 시 우편번호/상세주소 함께 저장
    if (settings.signup_fields.address.use) {
      const zipcode = pickStr(formData, 'zipcode')
      const detail = pickStr(formData, 'address_detail')
      update.zipcode = zipcode || null
      update.address_detail = detail || null
    }
    await supabase.from('profiles').update(update).eq('id', signUpData.user.id)
  }

  await supabase.auth.signInWithPassword({ email, password })
  redirect('/')
}

const LABEL: Record<FieldKey, string> = {
  name: '이름',
  gender: '성별',
  homepage: '홈페이지',
  phone: '연락처',
  address: '주소',
  birthdate: '생년월일',
  referrer: '추천인',
}
