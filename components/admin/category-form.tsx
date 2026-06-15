'use client'

import { useState, useRef } from 'react'
import { createCategory, updateCategory, uploadCategoryImage } from '@/app/admin/(dashboard)/categories/actions'
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
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = mode === 'edit' && category
  const newLevel = parentLevel ? parentLevel + 1 : 1

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.set('file', file)

    const result = await uploadCategoryImage(formData)
    if (result.url) {
      setImageUrl(result.url)
    } else {
      setError(result.error ?? '이미지 업로드 실패')
    }
    setUploading(false)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    formData.set('image_url', imageUrl)
    // 아래 필드들은 디자인 관리(레이아웃 편집기)에서 별도 편집하므로
    // 카테고리 폼에서는 기존 값을 그대로 다시 전달해 손상되지 않게 한다.
    if (isEdit && category) {
      formData.set('is_main', String(category.is_main ?? false))
      formData.set('pagination_mode', category.pagination_mode ?? 'load_more')
      formData.set('products_per_row', String(category.products_per_row ?? 4))
      formData.set('products_rows', String(category.products_rows ?? 10))
      formData.set('banner_url', category.banner_url ?? '')
      formData.set('banner_video_url', category.banner_video_url ?? '')
      formData.set('banner_show_overlay', String(category.banner_show_overlay ?? true))
    } else {
      formData.set('is_main', 'false')
      formData.set('pagination_mode', 'load_more')
      formData.set('products_per_row', '4')
      formData.set('products_rows', '10')
      formData.set('banner_url', '')
      formData.set('banner_video_url', '')
      formData.set('banner_show_overlay', 'true')
    }

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
          <label htmlFor="category_no" className="mb-1 block text-sm font-medium text-zinc-700">
            카테고리 번호
          </label>
          <input
            id="category_no"
            name="category_no"
            type="text"
            defaultValue={isEdit ? category.category_no ?? '' : ''}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="예: CATE7"
          />
        </div>

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

        {/* 카테고리 이미지 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            카테고리 이미지
          </label>
          <div className="flex items-start gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-zinc-400"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="카테고리" className="h-full w-full object-cover" />
              ) : (
                <span className="text-center text-[10px] text-zinc-400">
                  {uploading ? '업로드 중...' : '클릭하여\n이미지 선택'}
                </span>
              )}
            </div>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <p className="mt-1 text-xs text-zinc-400">메인 페이지 카테고리 섹션에 표시됩니다.</p>
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

        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500">
          💡 메인 노출 · 상품 목록 표시(페이징/한 줄 상품 수) · 카테고리 페이지 배너 설정은
          <span className="font-medium text-zinc-700"> 디자인 관리 → 레이아웃</span>에서
          미리보기 네비게이션 메뉴를 클릭해 카테고리 페이지로 이동한 뒤
          우하단 <span className="font-medium text-zinc-700">「편집」</span> 버튼으로 변경할 수 있습니다.
        </p>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || uploading}
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
