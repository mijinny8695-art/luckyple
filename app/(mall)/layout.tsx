import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PageTracker } from '@/components/layout/page-tracker'
import { LayerPopup } from '@/components/mall/layer-popup'
import { FloatingButtons } from '@/components/mall/floating-buttons'
import { getSiteConfigFull } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'
import { trackPageView } from '@/lib/track'

export default async function MallLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const site = await getSiteConfigFull()

  // 비동기로 추적 (렌더링 블로킹 없음)
  trackPageView(site.id).catch(() => {})

  // 활성 팝업 가져오기
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data: popups } = await supabase
    .from('layer_popups')
    .select('id, title, image_url, link_url, position, width')
    .eq('site_id', site.id)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('sort_order')

  return (
    <>
      <Header siteName={site.name} navItems={site.design?.nav_items} logoUrl={site.design?.logo_url} />
      <PageTracker siteId={site.id} />
      {popups && popups.length > 0 && <LayerPopup popups={popups} />}
      <FloatingButtons kakaoLink={site.design?.kakao_link} />
      <main>{children}</main>
      <Footer
        siteName={site.name}
        description={site.description}
        design={site.design}
      />
    </>
  )
}
