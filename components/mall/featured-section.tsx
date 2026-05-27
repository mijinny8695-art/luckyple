import { createClient } from '@/lib/supabase/server'
import { FeaturedProducts } from './featured-products'

export async function FeaturedSection({
  categoryId,
  label,
  subtitle,
  moreAction = 'link',
  display = 'grid',
  perRow = 4,
  rows = 2,
  autoSeconds = 0,
}: {
  categoryId: string
  label: string
  subtitle?: string
  moreAction?: 'link' | 'expand'
  display?: 'grid' | 'slider'
  perRow?: number
  rows?: number
  autoSeconds?: number
}) {
  const supabase = await createClient()

  // 해당 카테고리 + 하위 카테고리의 category_no 수집
  const { data: self } = await supabase
    .from('categories')
    .select('category_no, slug')
    .eq('id', categoryId)
    .single()

  const { data: level2 } = await supabase
    .from('categories')
    .select('id, category_no')
    .eq('parent_id', categoryId)

  const level2Ids = (level2 ?? []).map((c) => c.id)

  let level3Nos: string[] = []
  if (level2Ids.length > 0) {
    const { data: level3 } = await supabase
      .from('categories')
      .select('category_no')
      .in('parent_id', level2Ids)
    level3Nos = (level3 ?? []).map((c) => c.category_no).filter(Boolean) as string[]
  }

  // 모든 category_no 수집
  const allNos = [
    self?.category_no,
    ...(level2 ?? []).map((c) => c.category_no),
    ...level3Nos,
  ].filter(Boolean) as string[]

  if (allNos.length === 0) return null

  // 한 줄 갯수 × 줄 수 = 기본 노출 수. 슬라이드/펼치기는 더 가져와서 스크롤·확장에 사용
  const base = Math.max(1, perRow * rows)
  const limit = display === 'slider' || moreAction === 'expand' ? Math.max(base, 40) : base
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, thumbnail_url')
    .overlaps('category_nos', allNos)
    .eq('is_active', true)
    .order('product_no', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (!products || products.length === 0) return null

  return (
    <section className="pt-4 pb-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6">
          <h2 className="w-full [&_p]:my-0" dangerouslySetInnerHTML={{ __html: label }} />
          {subtitle && <div className="mt-1 [&_p]:my-0" dangerouslySetInnerHTML={{ __html: subtitle }} />}
        </div>
        <FeaturedProducts
          products={products}
          mode={moreAction}
          display={display}
          perRow={perRow}
          rows={rows}
          autoSeconds={autoSeconds}
          categoryHref={`/category/${self?.slug || categoryId}`}
          fromCategoryId={categoryId}
        />
      </div>
    </section>
  )
}
