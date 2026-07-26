import { createClient } from '@/lib/supabase/server'

/** 상품 본문/이미지 필드에서 Cloudflare Images URL 을 뽑아낼 때 쓰는 패턴 */
const CF_URL_RE = /https:\/\/imagedelivery\.net\/[^"'\s)]+/g

/** collectImageUrls / filterUnusedImageUrls 가 필요로 하는 최소 컬럼 */
export const PRODUCT_IMAGE_COLUMNS = 'thumbnail_url, sub_images, summary, description'

export type ProductImageRow = {
  thumbnail_url: string | null
  sub_images: string[] | null
  summary: string | null
  description: string | null
}

/** 상품 한 건(혹은 여러 건)이 참조하는 Cloudflare 이미지 URL 을 중복 없이 수집한다. */
export function collectImageUrls(
  rows: ProductImageRow | ProductImageRow[] | null | undefined
): string[] {
  if (!rows) return []
  const list = Array.isArray(rows) ? rows : [rows]

  const urls = new Set<string>()
  for (const row of list) {
    if (!row) continue
    if (row.thumbnail_url) urls.add(row.thumbnail_url)
    for (const u of row.sub_images ?? []) urls.add(u)
    for (const body of [row.summary, row.description]) {
      if (!body) continue
      for (const u of body.match(CF_URL_RE) ?? []) urls.add(u)
    }
  }
  return [...urls]
}

/**
 * 후보 URL 중 "이제 아무 상품도 참조하지 않는" 것만 남긴다.
 * 상품 복제(duplicateProduct)로 이미지 URL 을 공유하는 경우가 있어서,
 * 이 검사를 건너뛰면 살아있는 상품의 이미지까지 함께 깨진다.
 *
 * DB 삭제가 끝난 뒤에 호출해야 한다.
 */
export async function filterUnusedImageUrls(candidateUrls: string[]): Promise<string[]> {
  if (candidateUrls.length === 0) return []

  const supabase = await createClient()
  const { data: remaining, error } = await supabase
    .from('products')
    .select(PRODUCT_IMAGE_COLUMNS)

  // 조회 실패 시엔 아무것도 지우지 않는다 — 고아 이미지가 남는 편이
  // 살아있는 상품의 이미지를 지우는 것보다 안전하다.
  if (error) return []

  const inUse = new Set(collectImageUrls((remaining ?? []) as ProductImageRow[]))
  return candidateUrls.filter((u) => !inUse.has(u))
}
