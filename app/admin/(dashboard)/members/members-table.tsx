'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  updateMemberRole,
  deleteMember,
  adjustMemberPoints,
  getMemberPointHistory,
  updateMemberMemo,
  type Member,
  type PointHistoryEntry,
} from './actions'
import { type MemberSettings } from './settings/config'
import { formatRelativeTime } from '@/lib/relative-time'

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  order_use: { label: '주문 사용', color: 'text-rose-600' },
  order_earn: { label: '구매 적립', color: 'text-emerald-600' },
  order_cancel_restore: { label: '취소 복원', color: 'text-blue-600' },
  admin_grant: { label: '관리자 지급', color: 'text-emerald-600' },
  admin_revoke: { label: '관리자 회수', color: 'text-rose-600' },
}

export function MembersTable({
  members,
  // settings는 추후 동적 컬럼용으로 유지 (현재 디자인에서는 사용 안 함)
  settings: _settings,
}: {
  members: Member[]
  settings: MemberSettings | null
}) {
  void _settings
  const router = useRouter()
  const [adjusting, setAdjusting] = useState<Member | null>(null)
  const [memoEditing, setMemoEditing] = useState<Member | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allChecked = members.length > 0 && selectedIds.size === members.length
  const someChecked = selectedIds.size > 0 && selectedIds.size < members.length

  function toggleAll(v: boolean) {
    setSelectedIds(v ? new Set(members.map((m) => m.id)) : new Set())
  }
  function toggleOne(id: string, v: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (v) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <>
      <div className="mb-3 text-sm text-zinc-600">
        전체 사용자 <span className="font-semibold text-blue-600">{members.length}</span>명
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-400">등록된 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked
                      }}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <Th>닉네임</Th>
                  <Th>계정</Th>
                  <Th>회원 유형</Th>
                  <Th>가입일</Th>
                  <Th align="right">적립금</Th>
                  <Th>글/댓글/구매평/문의</Th>
                  <Th align="right">누적 구매금액</Th>
                  <Th>메모</Th>
                  <th className="w-12 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((member) => {
                  const checked = selectedIds.has(member.id)
                  return (
                    <tr
                      key={member.id}
                      onClick={() => router.push(`/admin/members/${member.id}`)}
                      className={`group cursor-pointer hover:bg-zinc-50/70 ${checked ? 'bg-blue-50/30' : ''}`}
                    >
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleOne(member.id, e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-900">
                        {member.name || <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">{member.email}</td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={async () => {
                            const newRole = member.role === 'admin' ? 'user' : 'admin'
                            if (confirm(`${member.email}의 역할을 ${newRole === 'admin' ? '관리자' : '일반회원'}로 변경하시겠습니까?`)) {
                              await updateMemberRole(member.id, newRole)
                              router.refresh()
                            }
                          }}
                          className={`cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition hover:opacity-80 ${
                            member.role === 'admin'
                              ? 'bg-violet-50 text-violet-700'
                              : 'text-zinc-600'
                          }`}
                          title="클릭하여 역할 변경"
                        >
                          {member.role === 'admin' ? '관리자' : '일반회원'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap">
                        {formatRelativeTime(member.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-900">
                        {member.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap">
                        <span className="font-mono">{member.post_count}</span>
                        <span className="text-zinc-300"> / 0 / 0 / 0</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-zinc-900">
                        {member.total_purchased > 0
                          ? member.total_purchased.toLocaleString()
                          : <span className="text-zinc-300">0</span>}
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setMemoEditing(member)}
                          title={member.memo ?? '메모 작성'}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.5-9.5a2.121 2.121 0 1 1 3 3L12 17l-4 1 1-4 9.5-9.5Z" />
                          </svg>
                          {member.memo && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-3.5 text-right">
                        <RowMenu
                          isOpen={openMenuId === member.id}
                          onToggle={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                          onClose={() => setOpenMenuId(null)}
                          onAdjustPoints={() => {
                            setAdjusting(member)
                            setOpenMenuId(null)
                          }}
                          onDelete={async () => {
                            setOpenMenuId(null)
                            if (member.role === 'admin') {
                              alert('관리자는 삭제할 수 없습니다. 먼저 일반회원으로 변경하세요.')
                              return
                            }
                            if (confirm(`${member.email} 회원을 삭제하시겠습니까?`)) {
                              await deleteMember(member.id)
                              router.refresh()
                            }
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
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

      {memoEditing && (
        <MemoModal
          member={memoEditing}
          onClose={() => setMemoEditing(null)}
          onSuccess={() => {
            setMemoEditing(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}

function RowMenu({
  isOpen,
  onToggle,
  onClose,
  onAdjustPoints,
  onDelete,
}: {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onAdjustPoints: () => void
  onDelete: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!isOpen || !btnRef.current) {
      setPos(null)
      return
    }
    const rect = btnRef.current.getBoundingClientRect()
    const MENU_W = 144
    const MENU_H = 80
    let left = rect.right - MENU_W
    let top = rect.bottom + 4
    if (top + MENU_H > window.innerHeight - 8) top = rect.top - MENU_H - 4
    if (left < 8) left = 8
    setPos({ top, left })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      onClose()
    }
    function handleScrollOrResize() {
      onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, onClose])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="더보기"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>
      {isOpen && pos && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-[1000] w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onAdjustPoints}
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-zinc-700 hover:bg-zinc-50"
            >
              포인트 조정
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50"
            >
              회원 삭제
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

function MemoModal({
  member,
  onClose,
  onSuccess,
}: {
  member: Member
  onClose: () => void
  onSuccess: () => void
}) {
  const [value, setValue] = useState(member.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const r = await updateMemberMemo(member.id, value)
    setSaving(false)
    if (r.error) {
      setError(r.error)
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">메모</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{member.name || member.email}</p>
        </div>
        <div className="p-5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            placeholder="이 회원에 대한 관리자 메모를 입력하세요."
            className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          {error && (
            <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}
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
            onClick={handleSave}
            disabled={saving}
            className="flex-1 cursor-pointer rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
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
