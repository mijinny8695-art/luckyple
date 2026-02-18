import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function trackPageView(siteId: string) {
  if (!siteId) return

  const supabase = await createClient()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const today = new Date().toISOString().slice(0, 10)

  // page_views 증가 (upsert)
  const { data: existing } = await supabase
    .from('daily_stats')
    .select('id, page_views, visitor_ips')
    .eq('site_id', siteId)
    .eq('date', today)
    .single()

  if (existing) {
    const visitorIps: string[] = existing.visitor_ips ?? []
    const isNewVisitor = !visitorIps.includes(ip)

    await supabase
      .from('daily_stats')
      .update({
        page_views: existing.page_views + 1,
        ...(isNewVisitor
          ? {
              visitors: visitorIps.length + 1,
              visitor_ips: [...visitorIps, ip],
            }
          : {}),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('daily_stats').insert({
      site_id: siteId,
      date: today,
      page_views: 1,
      visitors: 1,
      visitor_ips: [ip],
    })
  }
}
