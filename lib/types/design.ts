export type Banner = {
  id: string
  site_id: string
  position: string | null // deprecated, 레이아웃이 배치 담당
  title: string | null
  subtitle: string | null
  link_url: string | null
  link_text: string | null
  image_url: string
  mobile_image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type NavSubItem = {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

export type NavItem = {
  label: string
  href: string
  children?: NavSubItem[]
}

// ── 레이아웃 섹션 타입 ──

export type LayoutSectionType = 'banner' | 'categories' | 'featured' | 'brands' | 'cardBannerGroup'

export type LayoutSectionBase = {
  id: string
  type: LayoutSectionType
  visible: boolean
}

export type BannerSectionConfig = LayoutSectionBase & {
  type: 'banner'
  label: string
  display: 'carousel' | 'grid'
  bannerIds: string[]
  autoSeconds?: number // 캐러셀 자동 넘김 간격(초). 미설정 시 5초, 0 = 끔
}

export type CategoryCard = {
  id: string
  image: string
  text: string
  href: string
}

export type CategoriesSectionConfig = LayoutSectionBase & {
  type: 'categories'
  cards?: CategoryCard[]
  label?: string
  subtitle?: string
}

export type FeaturedSectionConfig = LayoutSectionBase & {
  type: 'featured'
  categoryId?: string
  label?: string
  subtitle?: string
  // 더보기 버튼 동작: 'link' = 카테고리 페이지로 이동(기본), 'expand' = 인라인으로 더 보여주기
  moreAction?: 'link' | 'expand'
  // 표시 형태: 'grid' = 단일 그리드(기본), 'slider' = 가로 슬라이드
  display?: 'grid' | 'slider'
  perRow?: number // 한 줄에 보여줄 상품 수 (데스크탑)
  rows?: number // 줄 수
  autoSeconds?: number // 슬라이드 자동 넘김 간격(초). 0 = 끔
}

export type BrandsSectionConfig = LayoutSectionBase & {
  type: 'brands'
}

export type CardBannerGroupConfig = LayoutSectionBase & {
  type: 'cardBannerGroup'
  label: string
  cards: CategoryCard[]
  cardHeight?: number
}

export type LayoutSection =
  | BannerSectionConfig
  | CategoriesSectionConfig
  | FeaturedSectionConfig
  | BrandsSectionConfig
  | CardBannerGroupConfig

export type SiteDesign = {
  id: string
  site_id: string
  logo_url: string | null
  hero_title: string | null
  hero_subtitle: string | null
  hero_cta_text: string
  hero_cta_link: string
  hero_bg_color: string
  nav_items: NavItem[]
  footer_phone: string | null
  footer_hours: string | null
  footer_lunch: string | null
  kakao_link: string | null
  show_categories_section: boolean
  show_featured_section: boolean
  show_brands_section: boolean
  brands_list: string[]
  homepage_layout: LayoutSection[] | null
  display_category_ids: string[]
  featured_category_id: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  seo_og_image: string | null
  seo_favicon: string | null
  seo_google_verification: string | null
  seo_naver_verification: string | null
  product_detail_top_html: string | null
  product_detail_bottom_html: string | null
  created_at: string
}
