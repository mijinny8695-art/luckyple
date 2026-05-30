import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteConfig, getSiteConfigFull } from '@/lib/site'
import { ProductGallery } from '@/components/mall/product-gallery'
import { ProductBuyBox } from '@/components/mall/product-buy-box'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId)
  const supabase = await createClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data: product } = await supabase
    .from('products')
    .select('name, slug, summary, thumbnail_url')
    .eq(isUuid ? 'id' : 'slug', id)
    .single()

  const site = await getSiteConfig()
  const slug = product?.slug || id
  const canonicalUrl = `https://${site.domain}/product/${slug}`
  const title = product?.name ?? '상품'
  const description = product?.summary?.replace(/<[^>]*>/g, '').slice(0, 160) ?? ''

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      ...(product?.thumbnail_url ? { images: [{ url: product.thumbnail_url }] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId)
  const supabase = await createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', id)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const { data: relations } = await supabase
    .from('product_categories')
    .select('category_id')
    .eq('product_id', product.id)

  // 브레드크럼: 사용자가 타고 들어온 카테고리(?cat=) 경로 우선, 없으면 상품의 가장 깊은 카테고리로 폴백
  const sp = await searchParams
  const fromCatId = typeof sp.cat === 'string' ? sp.cat : undefined
  const breadcrumb: { id: string; name: string; slug: string | null }[] = []
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, level')
  if (allCats) {
    const byId = new Map(allCats.map((c) => [c.id, c]))
    let cur = fromCatId ? byId.get(fromCatId) : undefined
    if (!cur && relations && relations.length > 0) {
      const catIds = relations.map((r) => r.category_id)
      const productCats = allCats.filter((c) => catIds.includes(c.id))
      cur = productCats.sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0]
    }
    const guard = new Set<string>()
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id)
      breadcrumb.unshift({ id: cur.id, name: cur.name, slug: cur.slug })
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
    }
  }

  const allImages = [
    ...(product.thumbnail_url ? [product.thumbnail_url] : []),
    ...((product.sub_images as string[]) ?? []),
  ]

  const siteConfig = await getSiteConfigFull()
  const topHtml = siteConfig.design?.product_detail_top_html
  const bottomHtml = siteConfig.design?.product_detail_bottom_html

  return (
    <div>
      {/* 상단 카테고리 경로 (브레드크럼) */}
      {breadcrumb.length > 0 && (
        <nav className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-4 pb-1">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900">Home</Link>
              </li>
              {breadcrumb.map((c, i) => (
                <li key={c.id} className="flex items-center gap-x-1.5">
                  <span className="text-zinc-300">›</span>
                  <Link
                    href={`/category/${c.slug || c.id}`}
                    className={i === breadcrumb.length - 1 ? 'font-medium text-zinc-900' : 'hover:text-zinc-900'}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      <div className="mx-auto max-w-7xl px-4 pt-2 pb-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* 이미지 갤러리 */}
        <div>
          <ProductGallery images={allImages} productName={product.name} />
        </div>

        {/* 상품 정보 */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{product.name}</h1>

          <p className="mt-4 text-3xl font-bold text-zinc-900">
            {product.price.toLocaleString()}원
          </p>

          {product.summary && (
            <div
              className="mt-6 text-sm leading-relaxed text-zinc-600"
              dangerouslySetInnerHTML={{ __html: product.summary }}
            />
          )}

          <ProductBuyBox productId={product.id} price={product.price} />
        </div>
      </div>

      {/* 상세 설명 */}
      <div className="mt-16 border-t border-zinc-200 pt-12">
        <h2 className="mb-6 text-lg font-bold text-zinc-900">상세 정보</h2>

        {/* 상단 고정 콘텐츠 */}
        {topHtml && (
          <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: topHtml }} />
        )}

        {product.description && (
          <div
            className="prose max-w-none text-zinc-700"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* 하단 고정 콘텐츠 */}
        {bottomHtml && (
          <div className="prose max-w-none mt-8" dangerouslySetInnerHTML={{ __html: bottomHtml }} />
        )}
      </div>
    </div>
    </div>
  )
}
