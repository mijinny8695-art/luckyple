'use client'

import { useState } from 'react'

type Props = {
  path: string
  title?: string
  className?: string
  inline?: boolean
}

// 공유 버튼: Web Share API → 안 되면 클립보드 복사
export function ShareButton({ path, title, className, inline = false }: Props) {
  const [copied, setCopied] = useState(false)

  async function handle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = typeof window !== 'undefined' ? window.location.origin + path : path
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // 사용자가 취소했거나 실패 → 폴백
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {
        prompt('아래 링크를 복사하세요:', url)
      }
    }
  }

  if (inline) {
    return (
      <button
        type="button"
        onClick={handle}
        className={className ?? 'cursor-pointer hover:text-zinc-700'}
      >
        {copied ? '복사됨' : '공유'}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={className ?? 'cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50'}
    >
      {copied ? '링크 복사됨' : '공유'}
    </button>
  )
}
