import Link from 'next/link'
import { getProducts, deleteProduct } from './actions'

export const metadata = { title: '상품 관리' }

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">상품 관리</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          상품 등록
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-400">등록된 상품이 없습니다.</p>
            <Link
              href="/admin/products/new"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              첫 상품을 등록해보세요
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">썸네일</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">상품명</th>
                  <th className="px-6 py-3 text-right font-medium text-zinc-500">가격</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">카테고리</th>
                  <th className="px-6 py-3 text-left font-medium text-zinc-500">등록일</th>
                  <th className="px-6 py-3 text-center font-medium text-zinc-500">상태</th>
                  <th className="px-6 py-3 text-center font-medium text-zinc-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-6 py-3">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-[10px] text-zinc-400">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        {product.category_nos?.map((no) => (
                          <span
                            key={no}
                            className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-600"
                          >
                            {no}
                          </span>
                        ))}
                      </div>
                      {product.summary && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{product.summary}</p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-zinc-900">
                      {product.price.toLocaleString()}원
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {product.categories?.map((cat) => (
                          <span
                            key={cat.id}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      {new Date(product.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          product.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {product.is_active ? '판매중' : '숨김'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <form
                        action={async () => {
                          'use server'
                          await deleteProduct(product.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
