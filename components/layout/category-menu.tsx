'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { NavItem } from '@/lib/types/design'

export function CategoryMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // admin 디자인 편집기 iframe 안에서 동작할 때, 부모에 드롭다운 열림 상태를 알려 오버레이가 클릭을 가로채지 않도록 한다.
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return
    try {
      window.parent.postMessage(
        { type: 'mall-nav-menu', open },
        window.location.origin,
      )
    } catch {}
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center px-3 text-[#484848] hover:text-zinc-900"
        style={{ height: '50px' }}
        aria-label="전체 메뉴"
        aria-expanded={open}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-2 min-w-[200px] rounded-xl border border-zinc-100 bg-white py-2 shadow-lg">
          {items.map((item, index) => (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className="block whitespace-nowrap px-5 py-2.5 text-[13px] font-bold text-[#484848] hover:bg-zinc-50 hover:text-zinc-900"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
