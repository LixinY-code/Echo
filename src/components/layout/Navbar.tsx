/**
 * Navbar — 顶部导航栏（Echo v2.0）
 *
 * 布局：[Echo Logo] ... [日记] [洞察] [角落] [+ 新对话]
 */
import { Link, useLocation } from 'react-router-dom'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'
import EchoLogo from '@/components/common/EchoLogo'

interface NavItem {
  to: string
  icon: IconName
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/journal', icon: 'journal', label: '日记' },
  { to: '/insights', icon: 'insight', label: '周信' },
  { to: '/corner', icon: 'corner', label: '角落' },
]

interface NavbarProps {
  onNewChat?: () => void  // v2.0 新增：新建对话回调
}

export default function Navbar({ onNewChat }: NavbarProps) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-milkBrown/5 bg-paper/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        {/* ===== 左侧：Echo 品牌 Logo ===== */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
          aria-label="Echo 首页"
        >
          <EchoLogo size="sm" showText={false} className="h-9 w-auto" />
          <span className="font-serif text-xl font-bold italic text-milkBrown tracking-wide">
            Echo
          </span>
        </Link>

        {/* ===== 右侧：功能图标 + 新对话按钮 ===== */}
        <div className="flex items-center gap-2">
          {/* 导航图标 */}
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className={[
                  'interactive-hover flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ease-soft',
                  active
                    ? 'bg-apricot text-milkBrown'           // v2.0 浅杏色选中态
                    : 'text-ink/45 hover:bg-apricot/30 hover:text-milkBrown',
                ].join(' ')}
              >
                <HandDrawnIcon name={item.icon} className="h-5 w-5" />
              </Link>
            )
          })}

          {/* 分隔线 */}
          <div className="mx-1 h-5 w-px bg-ink/10" />

          {/* v2.0 新增：+ 新对话按钮 */}
          {onNewChat && (
            <button
              onClick={onNewChat}
              aria-label="新对话"
              title="新对话"
              className="interactive-hover flex items-center gap-1.5 rounded-full bg-amber px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition-all duration-300 ease-soft hover:bg-amber-light hover:text-milkBrown"
            >
              <HandDrawnIcon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">新对话</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
