/**
 * Navbar — 顶部导航栏
 * 左侧：应用名 Echo + 镜子图标
 * 右侧：日记、洞察、角落 三个图标按钮
 */
import { Link, useLocation } from 'react-router-dom'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'

interface NavItem {
  to: string
  icon: IconName
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/journal', icon: 'journal', label: '日记' },
  { to: '/insights', icon: 'insight', label: '洞察' },
  { to: '/corner', icon: 'corner', label: '角落' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 paper-blur border-b border-ink/5">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
        {/* 左侧应用名 */}
        <Link
          to="/"
          className="group flex items-center gap-2 text-ink transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className="text-amber">
            <HandDrawnIcon name="mirror" className="h-6 w-6" />
          </span>
          <span className="text-xl font-extrabold tracking-wide">Echo</span>
        </Link>

        {/* 右侧导航 */}
        <div className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ease-soft',
                  active
                    ? 'bg-apricot-light text-ink'
                    : 'text-ink/55 hover:bg-ink/5 hover:text-ink',
                ].join(' ')}
              >
                <HandDrawnIcon name={item.icon} className="h-5 w-5" />
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
