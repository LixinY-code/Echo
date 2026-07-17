/**
 * MirrorPanel — Response Mirror 透明化面板
 * 手风琴式展开，揭示 AI 回答机制。四部分：
 * 1. 情绪信号  2. 回应策略  3. 可能盲点  4. 限制声明
 * 展开：从下往上滑入，内部元素依次淡入；半透明模糊纸张质感。
 */
import type { ReactNode } from 'react'
import type { MirrorData } from '@/types'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'

interface Props {
  data: MirrorData
}

interface Section {
  icon: IconName
  title: string
  render: () => ReactNode
}

export default function MirrorPanel({ data }: Props) {
  const sections: Section[] = [
    {
      icon: 'heart',
      title: '情绪信号',
      render: () => (
        <div className="flex flex-wrap gap-2">
          {data.signals.map((s, i) => (
            <span
              key={i}
              className="rounded-full bg-apricot-light/60 px-3 py-1 text-sm text-ink/75"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: 'compass',
      title: '回应策略',
      render: () => <p className="text-sm leading-relaxed text-ink/75">{data.strategy}</p>,
    },
    {
      icon: 'eye',
      title: '可能盲点',
      render: () => (
        <ul className="space-y-1.5">
          {data.blindspots.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink/75">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sage-deep" />
              {b}
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: 'sparkle',
      title: '限制声明',
      render: () => (
        <p className="text-sm italic leading-relaxed text-ink/55">{data.limitation}</p>
      ),
    },
  ]

  return (
    <div className="paper-blur mt-2 overflow-hidden rounded-2xl border border-ink/5 shadow-soft">
      <div className="space-y-3 p-4">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className="line-reveal"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-sage-deep">
                <HandDrawnIcon name={s.icon} className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold tracking-wide text-ink/60">
                {s.title}
              </span>
            </div>
            <div className="pl-5">{s.render()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
