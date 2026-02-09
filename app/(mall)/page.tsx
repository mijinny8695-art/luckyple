import Link from 'next/link'

const categories = [
  { name: '가방', color: 'from-amber-100 to-amber-200' },
  { name: '시계', color: 'from-slate-100 to-slate-200' },
  { name: '지갑', color: 'from-rose-100 to-rose-200' },
  { name: '신발', color: 'from-emerald-100 to-emerald-200' },
  { name: '의류', color: 'from-sky-100 to-sky-200' },
  { name: '액세서리', color: 'from-violet-100 to-violet-200' },
]

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

export default function HomePage() {
  return (
    <>
      {/* 히어로 배너 */}
      <section className="relative bg-zinc-900 text-white">
        <div className="mx-auto flex min-h-[480px] max-w-7xl flex-col items-center justify-center px-4 text-center">
          <p className="mb-4 text-sm tracking-widest text-zinc-400">
            PREMIUM QUALITY REPLICA
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            최상급 명품 레플리카
          </h1>
          <p className="mb-8 max-w-lg text-zinc-400">
            합리적인 가격으로 만나는 프리미엄 품질.
            디테일 하나하나에 정성을 담았습니다.
          </p>
          <Link
            href="/"
            className="rounded-full bg-white px-8 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            쇼핑하기
          </Link>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          카테고리
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href="/"
              className={`flex h-32 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-sm font-medium text-zinc-700 transition hover:scale-105`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 인기 상품 */}
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

      {/* 브랜드 */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          취급 브랜드
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {['GUCCI', 'LOUIS VUITTON', 'CHANEL', 'HERMES', 'DIOR', 'PRADA', 'BALENCIAGA', 'BOTTEGA VENETA'].map(
            (brand) => (
              <span
                key={brand}
                className="text-sm font-medium tracking-wider text-zinc-400"
              >
                {brand}
              </span>
            )
          )}
        </div>
      </section>
    </>
  )
}
