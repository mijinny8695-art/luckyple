import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">LUCKYPLE</h3>
            <p className="text-sm leading-relaxed">
              최상급 명품 레플리카를 합리적인 가격에 만나보세요.
              품질과 디테일에 자신 있습니다.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">고객센터</h4>
            <ul className="space-y-2 text-sm">
              <li>전화: 010-0000-0000</li>
              <li>운영시간: 평일 10:00 - 18:00</li>
              <li>점심시간: 12:00 - 13:00</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">이용안내</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">이용약관</Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">개인정보처리방침</Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white">교환 및 반품 안내</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-xs">
          &copy; 2026 LUCKYPLE. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
