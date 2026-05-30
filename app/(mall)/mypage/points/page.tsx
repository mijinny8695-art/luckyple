import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: '포인트 내역' }

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  order_use: { label: '주문 사용', color: 'text-rose-600' },
  order_earn: { label: '구매 적립', color: 'text-emerald-600' },
  order_cancel_restore: { label: '취소 복원', color: 'text-blue-600' },
  admin_grant: { label: '관리자 지급', color: 'text-emerald-600' },
  admin_revoke: { label: '관리자 회수', color: 'text-rose-600' },
}

export default async function PointsHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/mypage/points')

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  const { data: history } = await supabase
    .from('point_history')
    .select('id, delta, balance_after, reason, source, order_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">포인트 내역</h1>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">홈으로</Link>
      </div>

      <div className="mb-6 rounded-xl bg-zinc-900 px-6 py-5 text-white">
        <p className="text-xs text-zinc-300">보유 포인트</p>
        <p className="mt-1 font-mono text-3xl font-bold">
          {(profile?.points ?? 0).toLocaleString()}<span className="ml-1 text-xl">P</span>
        </p>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {!history || history.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-400">변동 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">일시</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">내용</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">유형</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">변동</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">잔액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((h) => {
                  const s = SOURCE_LABEL[h.source] ?? { label: h.source, color: 'text-zinc-600' }
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700">
                        {h.order_id ? (
                          <Link href={`/orders/${h.order_id}`} className="hover:text-zinc-900 hover:underline">
                            {h.reason}
                          </Link>
                        ) : (
                          h.reason
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs ${s.color}`}>{s.label}</td>
                      <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${h.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.delta > 0 ? '+' : ''}{h.delta.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-zinc-600">
                        {h.balance_after.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
