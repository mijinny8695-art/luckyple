import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { LogoutButton } from './logout-button'

const navItems = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/products', label: '상품 관리' },
  { href: '/admin/orders', label: '주문 관리' },
  { href: '/admin/settings', label: '설정' },
]

export function AdminSidebar({ user }: { user: User }) {
  return (
    <aside className="flex w-64 flex-col bg-zinc-900 text-white">
      <div className="p-6">
        <h2 className="text-lg font-bold">LUCKYPLE</h2>
        <p className="text-xs text-zinc-400">관리자 패널</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className="truncate text-xs text-zinc-400">{user.email}</p>
        <LogoutButton />
      </div>
    </aside>
  )
}
