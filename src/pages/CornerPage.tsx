/**
 * CornerPage — "我的角落" 成长数据页（Echo v4.0 情绪果实版）
 *
 * 布局：上下流式居中布局，暖杏色柔和渐变背景
 * 主视觉：数据驱动的情绪果树（每颗果实=一次对话，hover 显示 300 字总结）+ 数据卡片
 *
 * v4.0 更新：
 *  - EmotionTree 从 emotionCount 改为 fruits 数据驱动
 *  - 调用 /api/emotion-fruits 获取真实情绪果实数据
 *  - 无数据时 fallback 到装饰性模式
 */
import { useEffect, useState } from 'react'
import { getInsights, getEmotionFruits } from '@/services/api'
import type { EmotionFruitData } from '@/types'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import EmotionTree from '@/components/common/EmotionTree'

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
  // v4.0：真实情绪果实数据
  const [fruits, setFruits] = useState<EmotionFruitData[]>([])

  useEffect(() => {
    // 并行加载洞察数据 + 情绪果实
    Promise.all([
      getInsights().then(setData).catch((e) => console.warn('[corner] 加载洞察失败：', e)),
      getEmotionFruits().then(setFruits).catch((e) => console.warn('[corner] 加载情绪果实失败：', e)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-[calc(100vh-61px)] bg-gradient-to-b from-[#FFF9EF] via-[#FFF5E8] to-[#F5E6D3]/60">
      {/* ===== 返回按钮 ===== */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <button
          onClick={() => window.history.back()}
          aria-label="返回"
          className="interactive-hover flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft text-milkBrown transition-all duration-300"
        >
          <HandDrawnIcon name="arrow-left" className="h-5 w-5" />
        </button>
      </div>

      {/* ===== 主视觉区：数据驱动的情绪果树 + 标题 ===== */}
      <section className="relative mx-auto max-w-lg px-4 pt-4 pb-6">
        <div className="text-center">
          {/* v4.0: 使用数据驱动的 EmotionTree（fruits 来自后端） */}
          <EmotionTree
            fruits={fruits}
            fallbackCount={fruits.length > 0 ? fruits.length : undefined}
            size="xl"
            animated={true}
            className="mx-auto mb-3 h-[280px] w-auto max-w-full drop-shadow-sm"
          />

          {/* 标题组 */}
          <h1 className="font-serif text-3xl font-bold italic text-milkBrown mb-1.5">
            我的角落 🏠
          </h1>
          <p className="text-sm text-milkBrown/55 leading-relaxed">
            这里记着你一点一点长大的痕迹。
            {fruits.length > 0 && (
              <span className="ml-1 text-amber/70">
                已结出 {fruits.length} 颗果实 ✨
              </span>
            )}
          </p>
        </div>
      </section>

      {/* ===== 中部文案："悄悄开花了" ===== */}
      <div className="mx-auto max-w-lg px-4 pb-6 text-center">
        <p className="text-xl font-semibold text-milkBrown mb-1">
          悄悄开花了
        </p>
        <p className="text-[13px] text-hint">
          每一次对话，都结成一颗果实
          {fruits.length > 0 && `（共 ${fruits.length} 颗）`}
        </p>
      </div>

      {/* ===== 数据卡片（3 张等宽横向排列） ===== */}
      <section className="mx-auto max-w-lg px-4 pb-7">
        <div className="grid grid-cols-3 gap-3">
          {/* 本周完成的任务 */}
          <div className="interactive-hover group overflow-hidden rounded-2xl border border-milkBrown/6 bg-white p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover">
            <div className="mb-2 flex justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-macaron-pink/15 transition-colors group-hover:bg-macaron-pink/25">
                <HandDrawnIcon name="flower-red" className="h-5 w-5 text-macaron-pink" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown tabular-nums leading-none">
              {loading ? '–' : data?.completedQuests ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">件</p>
            <p className="text-[10px] text-hint/70">本周完成的任务</p>
          </div>

          {/* 记录的日记 */}
          <div className="interactive-hover group overflow-hidden rounded-2xl border border-milkBrown/6 bg-white p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover">
            <div className="mb-2 flex justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-macaron-green/15 transition-colors group-hover:bg-macaron-green/25">
                <HandDrawnIcon name="sprout-green" className="h-5 w-5 text-macaron-green" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown tabular-nums leading-none">
              {loading ? '–' : data?.journalCount ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">页</p>
            <p className="text-[10px] text-hint/70">记录的日记</p>
          </div>

          {/* 发现的盲点 */}
          <div className="interactive-hover group overflow-hidden rounded-2xl border border-milkBrown/6 bg-white p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover">
            <div className="mb-2 flex justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-macaron-blue/15 transition-colors group-hover:bg-macaron-blue/25">
                <HandDrawnIcon name="tree-eye" className="h-5 w-5 text-macaron-blue" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-milkBrown tabular-nums leading-none">
              {loading ? '–' : data?.blindspotCount ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-hint">次</p>
            <p className="text-[10px] text-hint/70">发现的盲点</p>
          </div>
        </div>
      </section>

      {/* ===== 操作按钮 ===== */}
      <section className="mx-auto max-w-lg px-4 pb-7 text-center">
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
        <p className="text-xs text-hint/65 italic leading-relaxed">
          这里没有评判，只有一盏亮着的小灯。
        </p>
      </footer>
    </div>
  )
}
