'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export function HeaderAuth({
  user,
  isAdmin,
  signupBonus = 0,
}: {
  user: User | null
  isAdmin: boolean
  signupBonus?: number
}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (user) {
    return (
      <>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-[12px] text-[#2a2a2a] hover:underline"
          >
            관리자
          </Link>
        )}
        <Link
          href="/mypage"
          className="text-[12px] text-[#2a2a2a] hover:underline"
        >
          마이페이지
        </Link>
        <Link
          href="/mypage"
          className="text-[12px] text-[#2a2a2a] hover:underline"
        >
          주문내역
        </Link>
        <Link
          href="/cart"
          className="text-[12px] text-[#2a2a2a] hover:underline"
        >
          장바구니
        </Link>
        <button
          onClick={handleLogout}
          className="text-[12px] text-[#2a2a2a] hover:underline"
        >
          로그아웃
        </button>
      </>
    )
  }

  return (
    <>
      <Link href="/login" className="text-[12px] text-[#2a2a2a] hover:underline">
        로그인
      </Link>
      <span className="relative">
        {signupBonus > 0 && (
          <span
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white shadow-md"
            aria-hidden
          >
            +{signupBonus.toLocaleString()}원
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-zinc-900" />
          </span>
        )}
        <Link href="/signup" className="text-[12px] text-[#2a2a2a] hover:underline">
          회원가입
        </Link>
      </span>
      <Link href="/cart" className="text-[12px] text-[#2a2a2a] hover:underline">
        장바구니
      </Link>
    </>
  )
}
