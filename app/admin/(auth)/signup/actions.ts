'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 최소 6자 이상이어야 합니다.' }
  }

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password,
  })

  if (error) {
    return { error: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  redirect('/admin/login?message=signup_success')
}
