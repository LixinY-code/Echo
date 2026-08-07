/**
 * Layout — 内页共享布局
 * 顶部 Navbar + 页面过渡包裹 + 内容容器
 */
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import PageTransition from '@/components/common/PageTransition'
import BreathingOverlay from '@/features/chat/BreathingOverlay'
import { useApp } from '@/context/AppContext'

export default function Layout() {
  const { breathingOpen, closeBreathing } = useApp()

  return (
    <div className="flex min-h-[100dvh] flex-col bg-cream native-safe-area">
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {breathingOpen && <BreathingOverlay onClose={closeBreathing} />}
    </div>
  )
}
