import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-widest text-zinc-900">
          LUCKYPLE
        </Link>
        <nav className="hidden gap-8 md:flex">
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            신상품
          </Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            베스트
          </Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            브랜드
          </Link>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            카테고리
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/login"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            관리자
          </Link>
        </div>
      </div>
    </header>
  )
}
