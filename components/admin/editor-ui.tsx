'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown, Type } from 'lucide-react'

export const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px']
export const COLORS = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

function useClickOutside(onClose: () => void, open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])
  return ref
}

// 어두운 툴바용 아이콘 버튼
export function ToolBtn({
  active = false,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded transition ${
        active ? 'bg-white/25 text-white' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export function Divider() {
  return <div className="mx-1 h-5 w-px bg-white/15" />
}

// 글자 크기 드롭다운 (T▾)
export function FontSizeDropdown({ onPick, dropUp = false }: { onPick: (size: string) => void; dropUp?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false), open)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="글자 크기"
        aria-label="글자 크기"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-0.5 rounded px-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        <Type size={15} />
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className={`absolute left-0 z-20 max-h-56 w-16 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(s); setOpen(false) }}
              className="block w-full px-3 py-1 text-left text-xs text-zinc-700 hover:bg-zinc-100"
            >
              {parseInt(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 색상 드롭다운 (글자색/배경색 공용)
export function ColorDropdown({
  icon,
  title,
  current,
  onPick,
  dropUp = false,
}: {
  icon: ReactNode
  title: string
  current?: string
  onPick: (color: string) => void
  dropUp?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('#000000')
  const ref = useClickOutside(() => setOpen(false), open)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 flex-col items-center justify-center gap-0.5 rounded text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        {icon}
        <span className="h-[3px] w-4 rounded-sm" style={{ backgroundColor: current || 'transparent' }} />
      </button>
      {open && (
        <div className={`absolute left-0 z-20 w-max rounded-lg border border-zinc-200 bg-white p-3 shadow-lg ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(c); setOpen(false) }}
                className="h-8 w-8 rounded-md border border-zinc-300 transition hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border border-zinc-300"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(custom); setOpen(false) }}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
