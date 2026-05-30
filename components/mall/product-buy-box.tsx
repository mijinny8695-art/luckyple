'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/app/(mall)/cart/actions'

export function ProductBuyBox({ productId, price }: { productId: string; price: number }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState<null | 'cart' | 'buynow'>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

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
    // 바로 구매 — 카트를 거치지 않고 checkout 으로 직접 (productId, quantity 전달)
    setBusy('buynow')
    router.push(`/checkout?productId=${encodeURIComponent(productId)}&qty=${quantity}`)
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

      {/* 합계 */}
      <div className="flex items-baseline justify-between border-t border-b border-zinc-100 py-3">
        <span className="text-sm text-zinc-500">총 결제 금액</span>
        <span className="text-xl font-bold text-zinc-900">{total.toLocaleString()}원</span>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
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
          onClick={handleBuyNow}
          disabled={busy !== null}
          className="flex-1 cursor-pointer rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy === 'buynow' ? '이동 중...' : '바로 구매'}
        </button>
      </div>

      {feedback && (
        <p className="text-center text-xs text-emerald-600">{feedback}</p>
      )}
    </div>
  )
}
