/**
 * CornerPage — "我的角落" 成长数据页（Echo v2.0）
 *
 * 布局：上下流式居中布局，暖杏色柔和渐变背景
 * 主视觉：大幅水彩情绪果树 + 数据卡片
 */
import { useEffect, useState } from 'react'
import { getInsights } from '@/services/api'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import EchoLogo from '@/components/common/EchoLogo'

interface Insights {
  mainTheme: string
  peakHours: string
  dependencySign: string
  reflection: string
  completedQuests: number
  journalCount: number
  blindspotCount: number
}

export default function CornerPage() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInsights()
      .then(setData)
      .catch((e) => console.warn('[corner] 加载洞察失败：', e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-[calc(100vh-61px)] bg-gradient-to-b from-cream to-apricot/30">
      {/* 返回按钮 */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <button
          onClick={() => window.history.back()}
          aria-label="返回"
          className="interactive-hover flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft text-milkBrown transition-all duration-300"
        >
          <HandDrawnIcon name="arrow-left" className="h-5 w-5" />
        </button>
      </div>

      {/* ===== v2.0 主视觉区：水彩情绪果树 + 标题 ===== */}
      <section className="relative mx-auto max-w-lg px-4 pt-6 pb-8">
        {/* 水彩光晕效果容器 */}
        <div className="watercolor-glow relative z-10 text-center">
          {/* 大幅 Echo Logo（放大版） */}
          <EchoLogo size="xl" showText={false} animated={true} className="mx-auto mb-4 h-48 w-auto drop-shadow-sm" />

          {/* 标题组 */}
          <h1 className="font-serif text-3xl font-bold italic text-milkBrown mb-2">
            我的角落 🌱
          </h1>
          <p className="text-sm text-milkBrown/60 leading-relaxed">
            这里记着你一点一点长大的痕迹。
          </p>
        </div>

        {/* 中部文案 */}
        <div className="mt-10 text-center">
          <p className="text-xl font-semibold text-milkBrown mb-1.5">
            悄悄开花了
          </p>
          <p className="text-sm text-hint">
            这些小小的坚持，会变成光 ✨
          </p>
        </div>
      </section>

      {/* ===== v2.0 数据卡片（3 张等宽横向排列） ===== */}
      <section className="mx-auto max-w-lg px-4 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {/* 本周完成的任务 */}
          <div className="interactive-hover warm-card p-4 text-center">
            <div className="mb-2 flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-macaron-pink/20">
                <HandDrawnIcon name="flower-red" className="h-5 w-5 text-macaron-pink" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown">
              {loading ? '–' : data?.completedQuests ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">本周任务</p>
          </div>

          {/* 记录的日记 */}
          <div className="interactive-hover warm-card p-4 text-center">
            <div className="mb-2 flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-macaron-green/20">
                <HandDrawnIcon name="sprout-green" className="h-5 w-5 text-macaron-green" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown">
              {loading ? '–' : data?.journalCount ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">日记页</p>
          </div>

          {/* 发现的盲点 */}
          <div className="interactive-hover warm-card p-4 text-center">
            <div className="mb-2 flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-macaron-blue/20">
                <HandDrawnIcon name="tree-eye" className="h-5 w-5 text-macaron-blue" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown">
              {loading ? '–' : data?.blindspotCount ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">盲点数</p>
          </div>
        </div>
      </section>

      {/* ===== 操作按钮 ===== */}
      <section className="mx-auto max-w-lg px-4 pb-8 text-center">
        <button
          onClick={() => { alert('记录功能开发中 💡') }}
          className="interactive-hover inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-base font-semibold text-white shadow-glow transition-all duration-300 ease-soft hover:bg-amber-light hover:text-milkBrown"
        >
          <HandDrawnIcon name="plus" className="h-5 w-5" />
          今天我做成了一件小事
        </button>
      </section>

      {/* ===== 底部收尾文案 ===== */}
      <footer className="pb-12 text-center">
        <p className="text-xs text-hint/70 italic">
          这里没有评判，只有一盏亮着的小灯。💡
        </p>
      </footer>
    </div>
  )
}
