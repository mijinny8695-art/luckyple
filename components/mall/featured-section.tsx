import Link from 'next/link'

const featuredProducts = [
  { brand: 'GUCCI', name: '마몬트 숄더백', price: '320,000' },
  { brand: 'LOUIS VUITTON', name: '네버풀 MM', price: '280,000' },
  { brand: 'CHANEL', name: '클래식 플랩백', price: '450,000' },
  { brand: 'HERMES', name: '버킨 30', price: '520,000' },
  { brand: 'DIOR', name: '레이디 디올', price: '380,000' },
  { brand: 'PRADA', name: '사피아노 토트', price: '250,000' },
  { brand: 'BALENCIAGA', name: '시티백', price: '290,000' },
  { brand: 'BOTTEGA VENETA', name: '카세트백', price: '340,000' },
]

export function FeaturedSection() {
  return (
    <section className="bg-zinc-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          인기 상품
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredProducts.map((product) => (
            <Link
              key={product.name}
              href="/"
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-48 items-center justify-center bg-zinc-100 text-zinc-400">
                <span className="text-xs">이미지 준비중</span>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-400">{product.brand}</p>
                <p className="mt-1 text-sm font-medium text-zinc-900 group-hover:underline">
                  {product.name}
                </p>
                <p className="mt-2 text-sm font-bold text-zinc-900">
                  {product.price}원
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
