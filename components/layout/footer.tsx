import Link from 'next/link'
import type { SiteDesign } from '@/lib/types/design'

export function Footer({
  siteName,
  description,
  design,
}: {
  siteName: string
  description: string | null
  design?: SiteDesign | null
}) {
  const phone = design?.footer_phone ?? '010-0000-0000'
  const hours = design?.footer_hours ?? '평일 10:00 - 18:00'
  const lunch = design?.footer_lunch ?? '12:00 - 13:00'

  return (
    <footer className="border-t border-zinc-100 bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <h3 className="mb-4 text-2xl tracking-widest text-white" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>{siteName}</h3>
          <p className="text-sm leading-relaxed">
            {description ?? '최상급 명품 레플리카를 합리적인 가격에 만나보세요.'}
          </p>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-xs">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
