'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteDesign, NavItem } from '@/lib/types/design'
import { upsertDesign } from './actions'

type CategoryOption = {
  id: string
  name: string
  level: number
  parent_id: string | null
}

type BoardOption = {
  id: string
  name: string
  slug: string
}

export function DesignManager({
  siteId,
  design,
  categories,
  boards,
}: {
  siteId: string
  design: SiteDesign | null
  categories: CategoryOption[]
  boards: BoardOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // 로고
  const [logoPreview, setLogoPreview] = useState<string | null>(design?.logo_url ?? null)
  const [removeLogo, setRemoveLogo] = useState(false)

  // 메인 카테고리 선택
  const [displayCategoryIds, setDisplayCategoryIds] = useState<string[]>(
    design?.display_category_ids ?? []
  )
  // 인기상품 카테고리
  const [featuredCategoryId, setFeaturedCategoryId] = useState<string>(
    design?.featured_category_id ?? ''
  )

  const level1Categories = categories.filter((c) => c.level === 1)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
      setRemoveLogo(false)
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    setRemoveLogo(true)
    const input = document.getElementById('logo_image') as HTMLInputElement
    if (input) input.value = ''
  }

  // 카테고리 배너
  const [catBannerPreview, setCatBannerPreview] = useState<string | null>(design?.category_banner_url ?? null)
  const [removeCatBanner, setRemoveCatBanner] = useState(false)

  function handleCatBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCatBannerPreview(URL.createObjectURL(file))
      setRemoveCatBanner(false)
    }
  }

  function handleRemoveCatBanner() {
    setCatBannerPreview(null)
    setRemoveCatBanner(true)
    const input = document.getElementById('category_banner_image') as HTMLInputElement
    if (input) input.value = ''
  }

  // 카테고리 배너 영상 (R2 직접 업로드)
  const [catVideoUrl, setCatVideoUrl] = useState<string | null>(design?.category_banner_video_url ?? null)
  const [catVideoName, setCatVideoName] = useState<string | null>(
    design?.category_banner_video_url ? design.category_banner_video_url.split('/').pop() ?? '등록됨' : null
  )
  const [removeCatVideo, setRemoveCatVideo] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  async function handleCatVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoUploading(true)
    setVideoProgress(0)
    setCatVideoName(file.name)

    try {
      // 1. 서버에서 presigned URL 받기
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })
      const { signedUrl, publicUrl, error: urlError } = await res.json()
      if (urlError) throw new Error(urlError)

      // 2. 브라우저에서 R2로 직접 업로드
      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('업로드 실패')))
        xhr.onerror = () => reject(new Error('업로드 실패'))
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.send(file)
      })

      setCatVideoUrl(publicUrl)
      setRemoveCatVideo(false)
      // 파일 input 비우기 (폼 제출 시 서버로 영상 파일이 전송되지 않도록)
      const input = document.getElementById('category_banner_video') as HTMLInputElement
      if (input) input.value = ''
    } catch (err) {
      setCatVideoName(null)
      setCatVideoUrl(null)
      alert(err instanceof Error ? err.message : '영상 업로드 실패')
    } finally {
      setVideoUploading(false)
      setVideoProgress(0)
    }
  }

  function handleRemoveCatVideo() {
    setCatVideoName(null)
    setCatVideoUrl(null)
    setRemoveCatVideo(true)
    const input = document.getElementById('category_banner_video') as HTMLInputElement
    if (input) input.value = ''
  }

  // 네비게이션 항목
  const [navItems, setNavItems] = useState<NavItem[]>(
    design?.nav_items ?? [
      { label: '신상품', href: '/' },
      { label: '베스트', href: '/' },
      { label: '브랜드', href: '/' },
      { label: '카테고리', href: '/' },
    ]
  )

  // 브랜드 목록
  const [brandsList, setBrandsList] = useState<string[]>(
    design?.brands_list ?? []
  )
  const [newBrand, setNewBrand] = useState('')

  // 네비게이션 드래그 앤 드롭
  const [navDragIndex, setNavDragIndex] = useState<number | null>(null)

  function handleNavDrop(targetIndex: number) {
    if (navDragIndex === null || navDragIndex === targetIndex) return
    setNavItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(navDragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setNavDragIndex(null)
  }

  function addNavItem() {
    setNavItems([...navItems, { label: '', href: '/' }])
  }

  function removeNavItem(index: number) {
    setNavItems(navItems.filter((_, i) => i !== index))
  }

  function updateNavItem(index: number, field: keyof NavItem, value: string) {
    const updated = [...navItems]
    updated[index] = { ...updated[index], [field]: value }
    setNavItems(updated)
  }

  function addBrand() {
    const trimmed = newBrand.trim()
    if (trimmed && !brandsList.includes(trimmed)) {
      setBrandsList([...brandsList, trimmed])
      setNewBrand('')
    }
  }

  function removeBrand(index: number) {
    setBrandsList(brandsList.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    formData.set('nav_items', JSON.stringify(navItems.filter((n) => n.label.trim())))
    formData.set('brands_list', JSON.stringify(brandsList))
    formData.set('display_category_ids', JSON.stringify(displayCategoryIds))
    formData.set('featured_category_id', featuredCategoryId)
    if (removeLogo) formData.set('remove_logo', 'true')
    if (removeCatBanner) formData.set('remove_category_banner', 'true')
    if (removeCatVideo) formData.set('remove_category_video', 'true')
    if (catVideoUrl) formData.set('category_banner_video_url', catVideoUrl)

    const result = await upsertDesign(siteId, formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          디자인 설정이 저장되었습니다.
        </div>
      )}

      {/* 로고 설정 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">로고 설정</h3>
        <p className="mb-4 text-sm text-zinc-500">
          로고 이미지를 등록하면 헤더에 사이트명 대신 로고가 표시됩니다.
        </p>

        <div className="flex items-start gap-6">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="로고 미리보기"
                className="h-16 w-auto max-w-[200px] rounded-lg border border-zinc-200 object-contain p-2"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
              >
                &times;
              </button>
            </div>
          ) : (
            <div className="flex h-16 w-[200px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-sm text-zinc-400">
              로고 없음
            </div>
          )}

          <div>
            <label
              htmlFor="logo_image"
              className="inline-block cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              {logoPreview ? '로고 변경' : '로고 업로드'}
            </label>
            <input
              id="logo_image"
              name="logo_image"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <p className="mt-1 text-xs text-zinc-400">PNG, SVG 권장 (투명 배경)</p>
          </div>
        </div>
      </div>

      {/* 히어로 기본 설정 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">
          히어로 기본 설정
        </h3>
        <p className="mb-4 text-sm text-zinc-500">
          배너가 등록되어 있으면 배너가 우선 표시됩니다.
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="hero_title"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                제목
              </label>
              <input
                id="hero_title"
                name="hero_title"
                type="text"
                defaultValue={design?.hero_title ?? ''}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="최상급 명품 레플리카"
              />
            </div>
            <div>
              <label
                htmlFor="hero_bg_color"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                배경색
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="hero_bg_color"
                  defaultValue={design?.hero_bg_color ?? '#18181b'}
                  className="h-[42px] w-[42px] cursor-pointer rounded-lg border border-zinc-300"
                />
                <input
                  id="hero_bg_color_text"
                  type="text"
                  defaultValue={design?.hero_bg_color ?? '#18181b'}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="hero_subtitle"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              부제목
            </label>
            <input
              id="hero_subtitle"
              name="hero_subtitle"
              type="text"
              defaultValue={design?.hero_subtitle ?? ''}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="합리적인 가격으로 만나는 프리미엄 품질."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="hero_cta_text"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                버튼 텍스트
              </label>
              <input
                id="hero_cta_text"
                name="hero_cta_text"
                type="text"
                defaultValue={design?.hero_cta_text ?? '쇼핑하기'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="쇼핑하기"
              />
            </div>
            <div>
              <label
                htmlFor="hero_cta_link"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                버튼 링크
              </label>
              <input
                id="hero_cta_link"
                name="hero_cta_link"
                type="text"
                defaultValue={design?.hero_cta_link ?? '/'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="/"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 페이지 배너 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">카테고리 페이지 배너</h3>
        <p className="mb-4 text-sm text-zinc-500">
          모든 카테고리 페이지 상단에 공통으로 표시되는 배너입니다.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="category_banner_title" className="mb-1 block text-sm font-medium text-zinc-700">
              배너 타이틀
            </label>
            <input
              id="category_banner_title"
              name="category_banner_title"
              type="text"
              defaultValue={design?.category_banner_title ?? ''}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="1:1 하이엔드 미러급"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">배너 이미지</label>
            <div className="flex items-start gap-4">
              {catBannerPreview ? (
                <div className="relative">
                  <img
                    src={catBannerPreview}
                    alt="카테고리 배너 미리보기"
                    className="h-24 w-auto max-w-[300px] rounded-lg border border-zinc-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCatBanner}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-sm text-zinc-400">
                  이미지 없음
                </div>
              )}
              <div>
                <label
                  htmlFor="category_banner_image"
                  className="inline-block cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                >
                  {catBannerPreview ? '이미지 변경' : '이미지 업로드'}
                </label>
                <input
                  id="category_banner_image"
                  name="category_banner_image"
                  type="file"
                  accept="image/*"
                  onChange={handleCatBannerChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-zinc-400">권장 사이즈: 1920 x 300px</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">배너 영상 (선택)</label>
            <div className="flex items-center gap-4">
              {catVideoName ? (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="max-w-[200px] truncate text-sm text-zinc-700">{catVideoName}</span>
                  {!videoUploading && (
                    <button
                      type="button"
                      onClick={handleRemoveCatVideo}
                      className="text-red-500 hover:text-red-600"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-10 w-[200px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-sm text-zinc-400">
                  영상 없음
                </div>
              )}
              <div>
                <label
                  htmlFor="category_banner_video"
                  className={`inline-block cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 ${videoUploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  {videoUploading ? `업로드 중... ${videoProgress}%` : catVideoName ? '영상 변경' : '영상 업로드'}
                </label>
                <input
                  id="category_banner_video"
                  name="category_banner_video"
                  type="file"
                  accept="video/*"
                  onChange={handleCatVideoChange}
                  className="hidden"
                  disabled={videoUploading}
                />
              </div>
            </div>
            {videoUploading && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full bg-zinc-900 transition-all" style={{ width: `${videoProgress}%` }} />
              </div>
            )}
            <p className="mt-1 text-xs text-zinc-400">영상이 등록되면 이미지 대신 영상이 자동재생됩니다. (MP4 권장)</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">네비게이션 메뉴</h3>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                const val = e.target.value
                if (!val) return
                if (val.startsWith('cat:')) {
                  const cat = categories.find((c) => c.id === val.slice(4))
                  if (cat) {
                    const subs = categories.filter((c) => c.parent_id === cat.id)
                    setNavItems([...navItems, {
                      label: cat.name,
                      href: `/category/${cat.id}`,
                      children: subs.length > 0 ? subs.map((s) => {
                        const thirds = categories.filter((c) => c.parent_id === s.id)
                        return {
                          label: s.name,
                          href: `/category/${s.id}`,
                          children: thirds.length > 0 ? thirds.map((t) => ({ label: t.name, href: `/category/${t.id}` })) : undefined,
                        }
                      }) : undefined,
                    }])
                  }
                } else if (val.startsWith('board:')) {
                  const board = boards.find((b) => b.id === val.slice(6))
                  if (board) setNavItems([...navItems, { label: board.name, href: `/board/${board.slug}` }])
                }
                e.target.value = ''
              }}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
            >
              <option value="">카테고리/게시판 추가</option>
              <optgroup label="카테고리">
                {categories.filter((c) => c.level === 1).map((cat) => (
                  <option key={cat.id} value={`cat:${cat.id}`}>{cat.name}</option>
                ))}
              </optgroup>
              <optgroup label="게시판">
                {boards.map((board) => (
                  <option key={board.id} value={`board:${board.id}`}>{board.name}</option>
                ))}
              </optgroup>
            </select>
            <button
              type="button"
              onClick={addNavItem}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              직접 추가
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {navItems.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => setNavDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleNavDrop(index)}
              onDragEnd={() => setNavDragIndex(null)}
              className={`rounded-lg border p-3 transition ${
                navDragIndex === index ? 'border-blue-400 opacity-50' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="cursor-grab text-zinc-400 active:cursor-grabbing">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                  className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  placeholder="메뉴명"
                />
                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => updateNavItem(index, 'href', e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  placeholder="/category/신발 또는 /board/notice"
                />
                {item.children && (
                  <span className="text-[10px] text-zinc-400">{item.children.length}개 하위</span>
                )}
                <button
                  type="button"
                  onClick={() => removeNavItem(index)}
                  className="flex-shrink-0 text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-44 mt-1 flex flex-wrap gap-1">
                  {item.children.map((child, ci) => (
                    <span key={ci} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">{child.label}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {navItems.length === 0 && (
            <p className="text-sm text-zinc-400">네비게이션 메뉴가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">푸터 정보</h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="footer_phone"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              전화번호
            </label>
            <input
              id="footer_phone"
              name="footer_phone"
              type="text"
              defaultValue={design?.footer_phone ?? ''}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="010-0000-0000"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="footer_hours"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                운영시간
              </label>
              <input
                id="footer_hours"
                name="footer_hours"
                type="text"
                defaultValue={design?.footer_hours ?? ''}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="평일 10:00 - 18:00"
              />
            </div>
            <div>
              <label
                htmlFor="footer_lunch"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                점심시간
              </label>
              <input
                id="footer_lunch"
                name="footer_lunch"
                type="text"
                defaultValue={design?.footer_lunch ?? ''}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="12:00 - 13:00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 브랜드 목록 */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">
          브랜드 목록
        </h3>
        <p className="mb-4 text-sm text-zinc-500">
          홈페이지 브랜드 섹션에 표시할 브랜드를 관리합니다.
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {brandsList.map((brand, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
            >
              {brand}
              <button
                type="button"
                onClick={() => removeBrand(index)}
                className="ml-1 text-zinc-400 hover:text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addBrand()
              }
            }}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="브랜드명 입력 후 Enter"
          />
          <button
            type="button"
            onClick={addBrand}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          >
            추가
          </button>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || videoUploading}
          className="rounded-lg bg-zinc-900 px-8 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? '저장 중...' : videoUploading ? '영상 업로드 중...' : '설정 저장'}
        </button>
      </div>
    </form>
  )
}
