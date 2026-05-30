'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/app/(mall)/cart/actions'
import { toggleWishlist } from '@/app/(mall)/product/wishlist-actions'

export function ProductBuyBox({
  productId,
  price,
  initialLiked = false,
  initialLikeCount = 0,
}: {
  productId: string
  price: number
  initialLiked?: boolean
  initialLikeCount?: number
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState<null | 'cart' | 'buynow' | 'like'>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  const dec = () => setQuantity((q) => Math.max(1, q - 1))
  const inc = () => setQuantity((q) => Math.min(99, q + 1))
  const onChangeQty = (v: string) => {
    const n = parseInt(v)
    if (!Number.isFinite(n)) setQuantity(1)
    else setQuantity(Math.min(99, Math.max(1, n)))
  }

  async function handleAddToCart() {
    setBusy('cart')
    const r = await addToCart(productId, quantity)
    setBusy(null)
    if (r.error) {
      alert(r.error)
      return
    }
    setFeedback('장바구니에 담겼습니다')
    setTimeout(() => setFeedback(null), 2000)
  }

  function handleBuyNow() {
    setBusy('buynow')
    router.push(`/checkout?productId=${encodeURIComponent(productId)}&qty=${quantity}`)
  }

  async function handleToggleLike() {
    setBusy('like')
    // 낙관적 갱신
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))

    const r = await toggleWishlist(productId)
    setBusy(null)
    if ('error' in r) {
      // 롤백
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
      alert(r.error)
      return
    }
    // 서버 응답으로 정합성 맞춤
    setLiked(r.liked)
    setLikeCount(r.count)
  }

  const total = price * quantity

  return (
    <div className="mt-8 space-y-4">
      {/* 수량 선택 */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
        <span className="text-sm font-medium text-zinc-700">수량</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dec}
            disabled={quantity <= 1}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="수량 감소"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => onChangeQty(e.target.value)}
            className="w-12 rounded-md border border-zinc-300 bg-white py-1 text-center text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={inc}
            disabled={quantity >= 99}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      </div>

      {/* 합계 — 「총 상품금액(N개)」 형태 */}
      <div className="flex items-baseline justify-between border-t border-b border-zinc-100 py-3">
        <span className="text-sm text-zinc-500">총 상품금액<span className="text-zinc-400">({quantity}개)</span></span>
        <span className="text-xl font-bold text-zinc-900">{total.toLocaleString()}원</span>
      </div>

      {/* 액션 버튼 — 구매하기 / 장바구니 / 찜 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={busy !== null}
          className="flex-1 cursor-pointer rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy === 'buynow' ? '이동 중...' : '구매하기'}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={busy !== null}
          className="flex-1 cursor-pointer rounded-lg border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy === 'cart' ? '담는 중...' : '장바구니'}
        </button>
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={busy !== null}
          aria-label={liked ? '찜 해제' : '찜하기'}
          className={`flex min-w-[80px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition disabled:opacity-50 ${
            liked
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <svg
            className={`h-4 w-4 ${liked ? 'fill-current' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likeCount}
        </button>
      </div>

      {feedback && (
        <p className="text-center text-xs text-emerald-600">{feedback}</p>
      )}
    </div>
  )
}
