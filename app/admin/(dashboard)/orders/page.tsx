import Link from 'next/link'
import { getOrders, type OrderStatus } from './actions'
import { OrderStatusSelect } from './order-status-select'

export const metadata = { title: '주문 관리' }

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending_payment', label: '입금 대기' },
  { value: 'paid', label: '입금 확인' },
  { value: 'preparing', label: '배송 준비' },
  { value: 'shipping', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소' },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    size?: string
    search?: string
    status?: string
    from?: string
    to?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1') || 1)
  const size = Math.max(1, parseInt(params.size ?? '20') || 20)
  const search = params.search ?? ''
  const status = (params.status ?? 'all') as OrderStatus | 'all'
  const from = params.from ?? ''
  const to = params.to ?? ''

  const { orders, total } = await getOrders({ page, size, search, status, from, to })
  const totalPages = Math.max(1, Math.ceil(total / size))

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams()
    const merged = {
      page: String(page),
      size: String(size),
      search,
      status,
      from,
      to,
      ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])),
    }
    for (const [k, v] of Object.entries(merged)) {
      if (k === 'page') {
        if (v !== '1') p.set(k, v)
      } else if (v && v !== 'all') {
        p.set(k, v)
      }
    }
    const qs = p.toString()
    return `/admin/orders${qs ? `?${qs}` : ''}`
  }

  // 페이지네이션 범위
  const maxButtons = 5
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2))
  const endPage = Math.min(totalPages, startPage + maxButtons - 1)
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1)
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">주문 관리</h1>
        <div className="text-sm text-zinc-500">
          총 <span className="font-semibold text-zinc-900">{total.toLocaleString()}</span>건
        </div>
      </div>

      {/* 필터 바 */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <form method="GET" action="/admin/orders" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_140px_140px_auto]">
          <input type="hidden" name="size" value={size} />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">주문번호 / 주문자 / 이메일</label>
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="예: 20260530, 홍길동, user@example.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">상태</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">시작일</label>
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">종료일</label>
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              검색
            </button>
            {(search || status !== 'all' || from || to) && (
              <Link
                href="/admin/orders"
                className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                초기화
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">
            조건에 맞는 주문이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">주문번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">주문일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">주문자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">상품</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">결제금액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((o) => {
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-900">{o.order_no}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('ko-KR')}
                        <br />
                        <span className="text-zinc-400">{new Date(o.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-900">{o.orderer_name}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{o.orderer_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-700">{o.item_count}개 상품</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-zinc-900 whitespace-nowrap">{o.total_amount.toLocaleString()}원</p>
                        {o.points_used > 0 && (
                          <p className="mt-0.5 text-[10px] text-rose-500 whitespace-nowrap">P {o.points_used.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OrderStatusSelect id={o.id} status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="cursor-pointer rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          상세
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <Link href={buildUrl({ page: 1 })} className={`rounded-lg px-3 py-2 text-sm ${page === 1 ? 'pointer-events-none text-zinc-300' : 'text-zinc-600 hover:bg-zinc-100'}`}>&laquo;</Link>
          <Link href={buildUrl({ page: Math.max(1, page - 1) })} className={`rounded-lg px-3 py-2 text-sm ${page === 1 ? 'pointer-events-none text-zinc-300' : 'text-zinc-600 hover:bg-zinc-100'}`}>&lsaquo;</Link>
          {pageNumbers.map((p) => (
            <Link key={p} href={buildUrl({ page: p })} className={`rounded-lg px-3 py-2 text-sm font-medium ${p === page ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>{p}</Link>
          ))}
          <Link href={buildUrl({ page: Math.min(totalPages, page + 1) })} className={`rounded-lg px-3 py-2 text-sm ${page === totalPages ? 'pointer-events-none text-zinc-300' : 'text-zinc-600 hover:bg-zinc-100'}`}>&rsaquo;</Link>
          <Link href={buildUrl({ page: totalPages })} className={`rounded-lg px-3 py-2 text-sm ${page === totalPages ? 'pointer-events-none text-zinc-300' : 'text-zinc-600 hover:bg-zinc-100'}`}>&raquo;</Link>
        </div>
      )}
    </div>
  )
}
