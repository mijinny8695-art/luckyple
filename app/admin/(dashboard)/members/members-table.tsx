'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMemberRole, deleteMember, adjustMemberPoints, getMemberPointHistory, type Member, type PointHistoryEntry } from './actions'

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  order_use: { label: '주문 사용', color: 'text-rose-600' },
  order_earn: { label: '구매 적립', color: 'text-emerald-600' },
  order_cancel_restore: { label: '취소 복원', color: 'text-blue-600' },
  admin_grant: { label: '관리자 지급', color: 'text-emerald-600' },
  admin_revoke: { label: '관리자 회수', color: 'text-rose-600' },
}

export function MembersTable({ members }: { members: Member[] }) {
  const router = useRouter()
  const [adjusting, setAdjusting] = useState<Member | null>(null)

  return (
    <>
      <div className="rounded-xl bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-400">등록된 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">회원정보</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">포인트</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">역할</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">가입일</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{member.name || '-'}</p>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono text-sm font-semibold text-zinc-900">
                        {member.points.toLocaleString()}<span className="ml-0.5 text-xs font-normal text-zinc-400">P</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={async () => {
                          const newRole = member.role === 'admin' ? 'user' : 'admin'
                          if (confirm(`${member.email}의 역할을 ${newRole === 'admin' ? '관리자' : '일반회원'}로 변경하시겠습니까?`)) {
                            await updateMemberRole(member.id, newRole)
                            router.refresh()
                          }
                        }}
                        className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-[11px] font-semibold transition hover:opacity-80 ${
                          member.role === 'admin'
                            ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                            : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200'
                        }`}
                        title="클릭하여 역할 변경"
                      >
                        {member.role === 'admin' ? '관리자' : '일반회원'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(member.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdjusting(member)}
                          className="cursor-pointer rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 transition hover:bg-emerald-100"
                        >
                          포인트 조정
                        </button>
                        <button
                          onClick={async () => {
                            if (member.role === 'admin') {
                              alert('관리자는 삭제할 수 없습니다. 먼저 일반회원으로 변경하세요.')
                              return
                            }
                            if (confirm(`${member.email} 회원을 삭제하시겠습니까?`)) {
                              await deleteMember(member.id)
                              router.refresh()
                            }
                          }}
                          className="cursor-pointer rounded-md bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adjusting && (
        <PointAdjustModal
          member={adjusting}
          onClose={() => setAdjusting(null)}
          onSuccess={() => {
            setAdjusting(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function PointAdjustModal({
  member,
  onClose,
  onSuccess,
}: {
  member: Member
  onClose: () => void
  onSuccess: () => void
}) {
  const [direction, setDirection] = useState<'grant' | 'revoke'>('grant')
  const [amountStr, setAmountStr] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<PointHistoryEntry[] | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  async function handleSubmit() {
    setError(null)
    const amount = parseInt(amountStr) || 0
    if (amount <= 0) {
      setError('1 이상의 숫자를 입력해주세요.')
      return
    }
    if (!reason.trim()) {
      setError('조정 사유를 입력해주세요.')
      return
    }
    setSubmitting(true)
    const delta = direction === 'grant' ? amount : -amount
    const r = await adjustMemberPoints(member.id, delta, reason)
    setSubmitting(false)
    if (r.error) {
      setError(r.error)
      return
    }
    onSuccess()
  }

  async function loadHistory() {
    if (history) return
    const h = await getMemberPointHistory(member.id, 50)
    setHistory(h)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-900">포인트 조정</h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            {member.name || member.email} · 현재 보유{' '}
            <span className="font-mono font-semibold text-zinc-900">{member.points.toLocaleString()}P</span>
          </p>
        </div>

        <div className="space-y-4 p-5">
          {/* 지급/회수 토글 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">조정 유형</label>
            <div className="inline-flex w-full overflow-hidden rounded-lg border border-zinc-300">
              <button
                type="button"
                onClick={() => setDirection('grant')}
                className={`flex-1 cursor-pointer py-2 text-sm font-medium ${
                  direction === 'grant' ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                + 지급
              </button>
              <button
                type="button"
                onClick={() => setDirection('revoke')}
                className={`flex-1 cursor-pointer py-2 text-sm font-medium ${
                  direction === 'revoke' ? 'bg-rose-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                − 회수
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">금액 (P)</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-right font-mono text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600">사유</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 이벤트 보너스, CS 보상, 오적립 회수 등"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 px-4 py-2.5 text-sm">
            조정 후 잔액 예상{' '}
            <span className="font-mono font-semibold text-zinc-900">
              {Math.max(0, member.points + (direction === 'grant' ? 1 : -1) * (parseInt(amountStr) || 0)).toLocaleString()}P
            </span>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          {/* 변동 이력 */}
          <div className="border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => {
                if (!showHistory) loadHistory()
                setShowHistory((v) => !v)
              }}
              className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              {showHistory ? '▾' : '▸'} 변동 이력 보기
            </button>
            {showHistory && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200">
                {history === null ? (
                  <p className="px-4 py-3 text-center text-xs text-zinc-400">불러오는 중...</p>
                ) : history.length === 0 ? (
                  <p className="px-4 py-3 text-center text-xs text-zinc-400">변동 이력이 없습니다.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                        <th className="px-3 py-2 text-left">일시</th>
                        <th className="px-3 py-2 text-left">사유</th>
                        <th className="px-3 py-2 text-left">유형</th>
                        <th className="px-3 py-2 text-right">변동</th>
                        <th className="px-3 py-2 text-right">잔액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {history.map((h) => {
                        const s = SOURCE_LABEL[h.source] ?? { label: h.source, color: 'text-zinc-600' }
                        return (
                          <tr key={h.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-zinc-500">
                              {new Date(h.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-3 py-2 text-zinc-700">{h.reason}</td>
                            <td className={`px-3 py-2 ${s.color}`}>{s.label}</td>
                            <td className={`px-3 py-2 text-right font-mono font-medium ${h.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {h.delta > 0 ? '+' : ''}{h.delta.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-zinc-700">{h.balance_after.toLocaleString()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 cursor-pointer rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${
              direction === 'grant' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting ? '처리 중...' : direction === 'grant' ? '지급' : '회수'}
          </button>
        </div>
      </div>
    </div>
  )
}
