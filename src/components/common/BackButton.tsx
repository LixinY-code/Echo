/**
 * BackButton — 页面左上角返回按钮
 * absolute 定位（相对于页面内容容器），位于 Navbar 下方、内容区域左上角。
 * 点击返回指定页面（默认 /chat）。
 * ⚠️ 使用此组件的父容器必须带 `relative` 定位。
 */
import { useNavigate } from 'react-router-dom'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'

interface Props {
  to?: string
}

export default function BackButton({ to = '/chat' }: Props) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      aria-label="返回"
      title="返回"
      className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50 shadow-soft transition-all duration-300 ease-soft hover:scale-[1.06] hover:shadow-soft-md active:scale-95"
    >
      <HandDrawnIcon name="arrow-left" className="h-5 w-5 text-ink/60" />
    </button>
  )
}