/**
 * BackButton — 页面左上角返回按钮
 * 固定左上角，圆形，暖色风格。点击返回指定页面（默认 /chat）。
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
      className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50 shadow-soft transition-all duration-300 ease-soft hover:scale-[1.06] hover:shadow-soft-md active:scale-95"
    >
      <HandDrawnIcon name="arrow-left" className="h-5 w-5 text-ink/60" />
    </button>
  )
}