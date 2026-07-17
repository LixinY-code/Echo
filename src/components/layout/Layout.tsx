/**
 * Layout — 内页共享布局
 * 顶部 Navbar + 页面过渡包裹 + 内容容器
 */
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import PageTransition from '@/components/common/PageTransition'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
