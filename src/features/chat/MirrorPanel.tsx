/**
 * MirrorPanel — Response Mirror 透明化面板
 * "AI 为什么这样说" 展示 AI 的推理过程。
 * 四段式结构化分析，无图标，口语化标题：
 * 1. 我从你的话里听到的（情绪标签）
 * 2. 我是怎么回你的（回应策略）
 * 3. 我可能没看到的地方（盲点段落）
 * 4. 我得老实说（限制声明，斜体）
 */
import type { MirrorData } from '@/types'

interface Props {
  data: MirrorData
}

export default function MirrorPanel({ data }: Props) {
  return (
    <div className="paper-blur mt-2 overflow-hidden rounded-2xl border border-ink/5 shadow-soft">
      <div className="space-y-4 p-5">
        {/* 1. 我从你的话里听到的 */}
        <section className="line-reveal" style={{ animationDelay: '0ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            我从你的话里听到的
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.signals.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-cream-200/80 px-3.5 py-1.5 text-sm text-ink/75 ring-1 ring-ink/6"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* 2. 我是怎么回你的 */}
        <section className="line-reveal" style={{ animationDelay: '90ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            我是怎么回你的
          </h3>
          <p className="text-[15px] leading-relaxed text-ink/70">
            {data.strategy}
          </p>
        </section>

        {/* 3. 我可能没看到的地方 */}
        <section className="line-reveal" style={{ animationDelay: '180ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            我可能没看到的地方
          </h3>
          <p className="text-[15px] leading-relaxed text-ink/70">
            {data.blindspots.join('、')}
          </p>
        </section>

        {/* 4. 我得老实说 */}
        <section className="line-reveal" style={{ animationDelay: '270ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            我得老实说
          </h3>
          <p className="text-[15px] italic leading-relaxed text-ink/55">
            {data.limitation}
          </p>
        </section>
      </div>
    </div>
  )
}
