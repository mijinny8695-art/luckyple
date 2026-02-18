import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeaderAuth } from './header-auth'
import type { NavItem } from '@/lib/types/design'

const defaultNavItems: NavItem[] = [
  { label: '신상품', href: '/' },
  { label: '베스트', href: '/' },
  { label: '브랜드', href: '/' },
  { label: '카테고리', href: '/' },
]

export async function Header({
  siteName,
  navItems,
}: {
  siteName: string
  navItems?: NavItem[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  const items = navItems && navItems.length > 0 ? navItems : defaultNavItems

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-widest text-zinc-900">
          {siteName}
        </Link>
        <nav className="hidden gap-8 md:flex">
          {items.map((item, index) => (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <HeaderAuth user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  )
}
