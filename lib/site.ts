import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Banner, SiteDesign, LayoutSection } from '@/lib/types/design'
import { resolveLayout } from '@/lib/default-layout'
import { cache } from 'react'

export type SiteConfig = {
  id: string
  domain: string
  name: string
  description: string | null
  logo_url: string | null
  footer_info: Record<string, string>
}

export type SiteConfigFull = SiteConfig & {
  design: SiteDesign | null
  banners: Banner[]
  layout: LayoutSection[]
}

// DB에 'https://example.com/' 처럼 저장돼 있어도 host 헤더와 매칭되도록 정규화
export function normalizeDomain(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

const FALLBACK_SITE: SiteConfig = {
  id: '',
  domain: 'localhost:3000',
  name: 'MYEONGPLE',
  description: '',
  logo_url: null,
  footer_info: {},
}

export type SiteRow = SiteConfig & Record<string, unknown>

// 일시적인 DB 오류로 폴백 브랜드가 노출되지 않도록 한 번 재시도한다.
async function fetchSites(): Promise<SiteRow[] | null> {
  const supabase = await createClient()
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error) return (data ?? []) as SiteRow[]
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return null
}

// 현재 host 에 해당하는 sites 행 (React cache: 같은 요청 내 중복 호출 방지)
export const getSiteRow = cache(async (): Promise<SiteRow | null> => {
  const headersList = await headers()
  const host = normalizeDomain(headersList.get('host') ?? 'localhost:3000')

  const sites = await fetchSites()
  if (!sites || sites.length === 0) return null

  const matched =
    sites.find((site) => normalizeDomain(site.domain) === host) ?? sites[0]

  return { ...matched, domain: normalizeDomain(matched.domain) || host }
})

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const row = await getSiteRow()
  return (row as SiteConfig) ?? FALLBACK_SITE
})

export const getSiteConfigFull = cache(async (): Promise<SiteConfigFull> => {
  const site = await getSiteConfig()

  if (!site.id) {
    return { ...site, design: null, banners: [], layout: resolveLayout(null, []) }
  }

  const supabase = await createClient()

  // 디자인 + 배너를 병렬로 가져옴
  const [designResult, bannersResult] = await Promise.all([
    supabase.from('site_design').select('*').eq('site_id', site.id).single(),
    supabase.from('banners').select('*').eq('site_id', site.id).eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const design = (designResult.data as SiteDesign) ?? null
  const banners = (bannersResult.data ?? []) as Banner[]

  return {
    ...site,
    design,
    banners,
    layout: resolveLayout(design, banners),
  }
})

// 카테고리 (헤더용) - React cache로 같은 요청 내 중복 방지
export const getCachedCategories = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, level')
    .lte('level', 2)
    .order('level')
    .order('sort_order')
  return data ?? []
})
