/**
 * LabVersions — Conversation Lab 多版本对比
 * 同一问题的三种不同回应风格：
 *   安慰模式（温柔陪伴）/ 挑战模式（温和质疑）/ 换框模式（换个角度）
 * 移动端：横向滑动卡片；桌面端：并排显示。
 */
import type { LabVersion } from '@/types'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'

interface Props {
  versions: LabVersion[]
  loading?: boolean
}

const STYLE_META: Record<string, { icon: IconName; color: string }> = {
  安慰模式: { icon: 'heart', color: 'bg-apricot-light/70 text-ink' },
  挑战模式: { icon: 'eye', color: 'bg-sage-light text-ink' },
  换框模式: { icon: 'compass', color: 'bg-amber-light/60 text-ink' },
}

function tagFor(style: string) {
  return STYLE_META[style] ?? { icon: 'sparkle', color: 'bg-cream-200 text-ink' }
}

export default function LabVersions({ versions, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream-200/60 px-4 py-3 text-sm text-ink/55">
        <span className="h-2 w-2 animate-bounce rounded-full bg-sage [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-sage [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-sage" />
        <span className="ml-1">正在准备不同的回应视角…</span>
      </div>
    )
  }

  if (!versions.length) return null

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-1.5 pl-1 text-xs font-semibold text-ink/50">
        <HandDrawnIcon name="sparkle" className="h-3.5 w-3.5" />
        AI 还能这样回
      </div>
      {/* 移动端横向滑动，桌面端 grid 并排 */}
      <div className="no-scrollbar -mx-1 flex snap-x-mandatory gap-3 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {versions.map((v, i) => {
          const meta = tagFor(v.style)
          return (
            <div
              key={i}
              className="warm-card snap-start flex-shrink-0 p-3.5 md:w-auto"
              style={{ width: '78%', animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.color}`}
                >
                  <HandDrawnIcon name={meta.icon} className="h-3 w-3" />
                  {v.style}
                </span>
                <span className="text-xs text-ink/45">{v.description}</span>
              </div>
              <p className="text-sm leading-relaxed text-ink/75">{v.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
