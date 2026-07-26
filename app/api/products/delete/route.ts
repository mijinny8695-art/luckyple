import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromCloudflare } from '@/lib/cloudflare-images'
import {
  PRODUCT_IMAGE_COLUMNS,
  collectImageUrls,
  filterUnusedImageUrls,
  type ProductImageRow,
} from '@/lib/product-images'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { ids } = await request.json() as { ids: string[] }
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'ID가 없습니다.' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1) 삭제 대상의 이미지 URL을 한 번의 쿼리로 수집 (DB 삭제 전이어야 한다)
  const { data: targets } = await supabase
    .from('products')
    .select(PRODUCT_IMAGE_COLUMNS)
    .in('id', ids)
  const candidateUrls = collectImageUrls((targets ?? []) as ProductImageRow[])

  // 2) DB 삭제 — 관리자가 기다리는 건 여기까지다
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) {
    return NextResponse.json({ error: '상품 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  revalidatePath('/admin/products')

  // 3) Cloudflare 이미지 정리는 응답 이후 백그라운드에서.
  //    after() 는 응답을 보낸 뒤에도 런타임이 함수를 살려두므로,
  //    관리자는 목록으로 바로 돌아가 다른 작업을 계속할 수 있다.
  if (candidateUrls.length > 0) {
    after(async () => {
      const toDelete = await filterUnusedImageUrls(candidateUrls)
      if (toDelete.length === 0) return
      await Promise.allSettled(toDelete.map((u) => deleteFromCloudflare(u)))
    })
  }

  return NextResponse.json({ ok: true, deleted: ids.length })
}
