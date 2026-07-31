/**
 * CornerPage — "我的角落" 成长数据页（Echo v4.1）
 *
 * 布局：上下流式居中布局，暖杏色柔和渐变背景
 * 主视觉：数据驱动的情绪果树（每颗果实=一次对话，hover 显示 300 字总结）+ 数据卡片
 *
 * v4.1 更新：
 *  - 新增刷新按钮（重新加载 insights + emotion fruits）
 *  - 实现「今天做成了一件小事」弹窗输入 + 保存功能
 *  - 保留完整情绪果树（成长花）功能
 */
import { useEffect, useState, useCallback } from 'react'
import { getInsights, getEmotionFruits, completeQuest } from '@/services/api'
import type { EmotionFruitData } from '@/types'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import EmotionTree from '@/components/common/EmotionTree'
import Garden from '@/components/common/Garden'

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
  const [refreshing, setRefreshing] = useState(false)
  // 真实情绪果实数据（成长花 / 情绪果树）
  const [fruits, setFruits] = useState<EmotionFruitData[]>([])

  // 「今天做成了一件小事」弹窗状态
  const [showQuestModal, setShowQuestModal] = useState(false)
  const [questInput, setQuestInput] = useState('')
  const [questSaving, setQuestSaving] = useState(false)
  const [questSuccess, setQuestSuccess] = useState(false)

  /** 加载所有数据（insights + emotion fruits） */
  const loadData = useCallback(async () => {
    try {
      const [insightsResult, fruitsResult] = await Promise.all([
        getInsights().catch((e) => {
          console.warn('[corner] 加载洞察失败：', e)
          return null
        }),
        getEmotionFruits().catch((e) => {
          console.warn('[corner] 加载情绪果实失败：', e)
          return [] as EmotionFruitData[]
        }),
      ])
      if (insightsResult) setData(insightsResult)
      setFruits(fruitsResult)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** 刷新按钮处理 */
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  /** 打开记小事弹窗 */
  const handleOpenQuestModal = useCallback(() => {
    setQuestInput('')
    setQuestSuccess(false)
    setShowQuestModal(true)
  }, [])

  /** 提交小事记录 */
  const handleSubmitQuest = useCallback(async () => {
    const text = questInput.trim()
    if (!text) return

    setQuestSaving(true)
    try {
      await completeQuest('daily-small-win')
      // 更新本地计数（即时反馈，不等后端刷新）
      setData((prev) =>
        prev ? { ...prev, completedQuests: prev.completedQuests + 1 } : prev
      )
      setQuestSuccess(true)
      // 1.5 秒后自动关闭弹窗
      setTimeout(() => {
        setShowQuestModal(false)
        // 刷新全部数据
        handleRefresh()
      }, 1500)
    } catch (e) {
      console.warn('[corner] 记录小事失败：', e)
    } finally {
      setQuestSaving(false)
    }
  }, [questInput, handleRefresh])

  return (
    <div className="min-h-[calc(100vh-61px)] bg-gradient-to-b from-[#FFF9EF] via-[#FFF5E8] to-[#F5E6D3]/60">
      {/* ===== 顶部栏：返回 + 刷新 ===== */}
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-4">
        {/* 返回按钮 */}
        <button
          onClick={() => window.history.back()}
          aria-label="返回"
          className="interactive-hover flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft text-milkBrown transition-all duration-300"
        >
          <HandDrawnIcon name="arrow-left" className="h-5 w-5" />
        </button>

        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="刷新数据"
          className={`interactive-hover flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft transition-all duration-300 ${
            refreshing ? 'animate-spin opacity-60' : 'text-milkBrown hover:text-amber'
          }`}
        >
          <HandDrawnIcon name="refresh" className="h-5 w-5" />
        </button>
      </div>

      {/* ===== 主视觉区：情绪果树 + 生长花（对称排布）+ 标题 ===== */}
      <section className="relative mx-auto max-w-lg px-4 pt-4 pb-6">
        <div className="text-center">
          {/* 对称布局：生长花（左） + 情绪果树（右）—— 同尺寸 */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* 左侧：Garden 生长花（与树同级大小） */}
            <div className="flex-shrink-0">
              <Garden
                questCount={data?.completedQuests ?? 0}
                size="xl"
                className="opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm"
              />
            </div>

            {/* 右侧：EmotionTree 情绪果树（每颗果实 = 一次对话） */}
            <EmotionTree
              fruits={fruits}
              fallbackCount={fruits.length > 0 ? fruits.length : undefined}
              size="xl"
              animated={true}
              className="h-[260px] w-auto max-w-[280px] drop-shadow-sm"
            />
          </div>

          {/* 标题组 */}
          <h1 className="mt-2 font-serif text-3xl font-bold italic text-milkBrown mb-1.5">
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
          悄悄开花了 🌱
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

      {/* ===== 操作按钮：记录今天的小事 ===== */}
      <section className="mx-auto max-w-lg px-4 pb-7 text-center">
        <button
          onClick={handleOpenQuestModal}
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

      {/* ============================================================ */}
      {/* 「今天做成了一件小事」弹窗 */}
      {/* ============================================================ */}
      {showQuestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <div
            className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-milkBrown">
                🌸 记录今天的小事
              </h3>
              <button
                onClick={() => setShowQuestModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-hint transition-colors hover:bg-apricot/30 hover:text-milkBrown"
              >
                ✕
              </button>
            </div>

            {/* 成功状态 */}
            {questSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-macaron-green/20">
                  <HandDrawnIcon name="sprout-green" className="h-8 w-8 text-macaron-green" />
                </div>
                <p className="text-lg font-semibold text-milkBrown">
                  记录成功！🎉
                </p>
                <p className="mt-1 text-sm text-hint">
                  这件小事已经变成你成长树上的一片新叶子
                </p>
              </div>
            ) : (
              <>
                {/* 输入区域 */}
                <p className="mb-3 text-sm text-hint">
                  哪怕再小的事也值得被记住——喝够八杯水、按时吃了早饭、对陌生人说了谢谢……
                </p>
                <textarea
                  value={questInput}
                  onChange={(e) => setQuestInput(e.target.value)}
                  placeholder="今天我做了一件……"
                  rows={3}
                  maxLength={200}
                  autoFocus
                  className="w-full resize-none rounded-2xl border border-milkBrown/12 bg-cream/50 px-4 py-3 text-[15px] leading-relaxed text-milkBrown placeholder:text-hint/50 focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitQuest()
                    }
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-hint/60">
                    {questInput.length}/200
                  </span>
                  <button
                    onClick={handleSubmitQuest}
                    disabled={!questInput.trim() || questSaving}
                    className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ${
                      questInput.trim() && !questSaving
                        ? 'bg-amber shadow-glow hover:bg-amber-light hover:text-milkBrown'
                        : 'cursor-not-allowed bg-milkBrown/20'
                    }`}
                  >
                    {questSaving ? '保存中…' : '记录下来 ✨'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 点击遮罩层关闭弹窗 */}
      {showQuestModal && !questSuccess && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowQuestModal(false)}
        />
      )}
    </div>
  )
}
