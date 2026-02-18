'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Product = {
  id: string
  name: string
  summary: string | null
  description: string | null
  price: number
  thumbnail_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: { id: string; name: string }[]
}

export async function getProducts() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !products) return []

  // 각 상품의 카테고리 조회
  const productIds = products.map((p) => p.id)
  const { data: relations } = await supabase
    .from('product_categories')
    .select('product_id, category_id')
    .in('product_id', productIds)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')

  const categoryMap = new Map(categories?.map((c) => [c.id, c.name]) ?? [])

  return products.map((product) => ({
    ...product,
    categories: (relations ?? [])
      .filter((r) => r.product_id === product.id)
      .map((r) => ({ id: r.category_id, name: categoryMap.get(r.category_id) ?? '' })),
  })) as Product[]
}

export async function getAllCategoriesFlat() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, parent_id, level')
    .order('level')
    .order('sort_order')

  return data ?? []
}

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) return { error: '파일이 없습니다.' }

  const { uploadToCloudflare } = await import('@/lib/cloudflare-images')
  return uploadToCloudflare(file)
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const summary = formData.get('summary') as string
  const description = formData.get('description') as string
  const price = parseInt(formData.get('price') as string) || 0
  const thumbnailUrl = formData.get('thumbnail_url') as string
  const categoryIds = JSON.parse(formData.get('category_ids') as string || '[]') as string[]

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name,
      summary,
      description,
      price,
      thumbnail_url: thumbnailUrl || null,
    })
    .select('id')
    .single()

  if (error || !product) {
    return { error: '상품 등록 중 오류가 발생했습니다.' }
  }

  // 카테고리 연결
  if (categoryIds.length > 0) {
    const relations = categoryIds.map((categoryId) => ({
      product_id: product.id,
      category_id: categoryId,
    }))

    await supabase.from('product_categories').insert(relations)
  }

  revalidatePath('/admin/products')
  return { success: true, id: product.id }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: '상품 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/products')
  return { success: true }
}
