/**
 * WarmButton — 温暖柔和的按钮
 * 悬停时背景变亮、轻微放大、柔光，符合手作氛围。
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'amber'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  // 主按钮：杏色填充
  primary:
    'bg-apricot text-ink hover:bg-apricot-light hover:shadow-glow disabled:bg-apricot/50',
  // 次要：鼠尾草绿
  secondary:
    'bg-sage text-white hover:bg-sage-deep hover:shadow-soft-md disabled:bg-sage/50',
  // 幽灵：透明
  ghost:
    'bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink',
  // 琥珀强调
  amber:
    'bg-amber text-white hover:bg-amber-light hover:shadow-glow disabled:bg-amber/50',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-2xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-3xl',
}

export default function WarmButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-300 ease-soft',
        'hover:scale-[1.02] active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:cursor-not-allowed disabled:hover:scale-100',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
