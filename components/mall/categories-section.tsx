import Link from 'next/link'

const categories = [
  { name: '가방', color: 'from-amber-100 to-amber-200' },
  { name: '시계', color: 'from-slate-100 to-slate-200' },
  { name: '지갑', color: 'from-rose-100 to-rose-200' },
  { name: '신발', color: 'from-emerald-100 to-emerald-200' },
  { name: '의류', color: 'from-sky-100 to-sky-200' },
  { name: '액세서리', color: 'from-violet-100 to-violet-200' },
]

export function CategoriesSection() {
  return (
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
  )
}
