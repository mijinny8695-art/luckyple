'use client'

import { useState } from 'react'
import { createCategory, updateCategory } from '@/app/admin/(dashboard)/categories/actions'
import type { Category } from '@/app/admin/(dashboard)/categories/actions'

export function CategoryForm({
  mode,
  category,
  parentId,
  parentLevel,
  onDone,
}: {
  mode: 'create' | 'edit'
  category?: Category | null
  parentId?: string | null
  parentLevel?: number
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEdit = mode === 'edit' && category
  const newLevel = parentLevel ? parentLevel + 1 : 1

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    let result
    if (isEdit) {
      result = await updateCategory(formData)
    } else {
      result = await createCategory(formData)
    }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onDone()
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">
        {isEdit ? '카테고리 수정' : parentId ? `${newLevel}차 카테고리 추가` : '1차 카테고리 추가'}
      </h3>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {isEdit && <input type="hidden" name="id" value={category.id} />}
        {parentId && <input type="hidden" name="parent_id" value={parentId} />}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
            카테고리 이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={isEdit ? category.name : ''}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="카테고리 이름을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="sort_order" className="mb-1 block text-sm font-medium text-zinc-700">
            정렬 순서
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={isEdit ? category.sort_order : 0}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-zinc-400">숫자가 작을수록 앞에 표시됩니다.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? '저장 중...' : isEdit ? '수정' : '추가'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
