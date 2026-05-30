import { getMembers } from './actions'
import { getMemberSettings } from './settings/config'
import { MembersTable } from './members-table'
import { getAdminSiteId } from '@/lib/admin-site'
import { getSites } from '@/app/admin/(dashboard)/settings/actions'

export const metadata = { title: '회원 관리' }

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search ?? ''
  const members = await getMembers(search)
  const sites = await getSites()
  const currentSiteId = await getAdminSiteId(sites)
  const currentSite = sites.find((s) => s.id === currentSiteId) ?? sites[0]
  const memberSettings = currentSite ? getMemberSettings(currentSite) : null

  return (
    <div>
      {/* 검색 */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <form method="GET" action="/admin/members" className="flex gap-3">
          <input
            name="search"
            type="text"
            defaultValue={search}
            placeholder="이메일로 검색..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            검색
          </button>
          {search && (
            <a
              href="/admin/members"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              초기화
            </a>
          )}
        </form>
      </div>

      <MembersTable members={members} settings={memberSettings} />
    </div>
  )
}
