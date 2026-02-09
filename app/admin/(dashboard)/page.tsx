export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
      <p className="mt-2 text-zinc-500">관리자 대시보드에 오신 것을 환영합니다.</p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="총 상품" value="0" />
        <StatCard title="총 주문" value="0" />
        <StatCard title="총 회원" value="0" />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
    </div>
  )
}
