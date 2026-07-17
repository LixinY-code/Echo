/**
 * PageTransition — 页面切换淡入
 * 路由变化时以 key 触发重新挂载，播放淡入动画，柔和无闪烁。
 */
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface Props {
  children: ReactNode
}

export default function PageTransition({ children }: Props) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-fade-in">
      {children}
    </div>
  )
}
