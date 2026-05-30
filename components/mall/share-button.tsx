'use client'

import { useState } from 'react'

type Props = {
  path: string
  title?: string
  className?: string
  inline?: boolean
  // 커스텀 콘텐츠 (아이콘 등). 지정하면 텍스트 라벨 대신 이걸 표시
  children?: React.ReactNode
  // 복사됨 토스트를 시각적으로 잠깐 보여줄지 (children 모드일 때 default true)
  showCopiedHint?: boolean
}

// 공유 버튼: Web Share API → 안 되면 클립보드 복사
export function ShareButton({ path, title, className, inline = false, children, showCopiedHint }: Props) {
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

  // 아이콘/커스텀 콘텐츠 모드
  if (children) {
    return (
      <button
        type="button"
        onClick={handle}
        title={copied ? '복사됨' : '공유'}
        aria-label="공유"
        className={`relative ${className ?? 'cursor-pointer text-zinc-500 hover:text-zinc-900'}`}
      >
        {children}
        {copied && (showCopiedHint ?? true) && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
            링크 복사됨
          </span>
        )}
      </button>
    )
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
