import { getSites } from './actions'
import { SiteManager } from './site-manager'
import { CommerceSettings } from './commerce-settings'
import { getAdminSiteId } from '@/lib/admin-site'

export const metadata = { title: '설정' }

export default async function SettingsPage() {
  const sites = await getSites()
  const currentSiteId = await getAdminSiteId(sites)
  const currentSite = sites.find((s) => s.id === currentSiteId) ?? sites[0]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">설정</h1>
      {currentSite && <CommerceSettings site={currentSite} />}
      <SiteManager sites={sites} />
    </div>
  )
}
