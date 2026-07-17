/**
 * CornerPage — 我的角落
 * - 中央手绘小花园，根据完成的现实任务数呈现不同生长状态
 * - 卡片：本周任务数 / 日记数量 / 盲点次数
 * - 温暖总结文案
 * - 午后阳光渐变背景
 * - "我做了"按钮：完成现实任务，让花园生长
 */
import { useEffect, useState, useCallback } from 'react'
import type { Insights } from '@/types'
import { getInsights, completeQuest } from '@/services/api'
import { useApp } from '@/context/AppContext'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'
import WarmButton from '@/components/common/WarmButton'

interface StatCard {
  icon: IconName
  label: string
  value: number
  unit: string
}

/** 根据 quest 数量返回花园生长阶段 */
function gardenStage(count: number): {
  stage: string
  label: string
  hint: string
} {
  if (count <= 0) return { stage: 'seed', label: '一颗种子', hint: '一切才刚刚开始' }
  if (count <= 2) return { stage: 'sprout', label: '冒出了嫩芽', hint: '你已经迈出了第一步' }
  if (count <= 4) return { stage: 'leaf', label: '长出了叶子', hint: '正在悄悄扎根' }
  return { stage: 'flower', label: '悄悄开花了', hint: '这些小小的坚持，会变成光' }
}

export default function CornerPage() {
  const { questCount, refreshQuestCount, bumpQuestCount } = useApp()
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await getInsights()
      setInsights(d)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    refreshQuestCount()
  }, [load, refreshQuestCount])

  const handleComplete = useCallback(async () => {
    if (completing) return
    setCompleting(true)
    try {
      await completeQuest(crypto.randomUUID?.() ?? String(Date.now()))
      bumpQuestCount()
    } finally {
      setCompleting(false)
    }
  }, [completing, bumpQuestCount])

  const stage = gardenStage(questCount)

  const stats: StatCard[] = [
    { icon: 'leaf', label: '本周完成的任务', value: questCount, unit: '件' },
    { icon: 'journal', label: '记录的日记', value: insights?.journalCount ?? 0, unit: '页' },
    { icon: 'eye', label: '发现的盲点', value: insights?.blindspotCount ?? 0, unit: '次' },
  ]

  return (
    <div className="min-h-[calc(100vh-61px)] bg-afternoon">
      <div className="mx-auto max-w-2xl px-5 py-9">
        {/* 标题 */}
        <div className="mb-2 text-center">
          <h1 className="font-hand text-3xl text-ink">我的角落</h1>
          <p className="mt-1 text-sm text-ink/55">这里记着你一点一点长大的痕迹。</p>
        </div>

        {/* ===== 中央花园 ===== */}
        <div className="mt-8 flex flex-col items-center">
          <Garden stage={stage.stage} />
          <p className="mt-4 font-hand text-2xl text-ink/80">{stage.label}</p>
          <p className="mt-1 text-sm text-ink/45">{stage.hint}</p>

          {/* 我做了 按钮 */}
          <WarmButton
            variant="amber"
            size="sm"
            className="mt-6 !rounded-full"
            onClick={handleComplete}
            disabled={completing}
          >
            <HandDrawnIcon name="plus" className="h-4 w-4" />
            {completing ? '记下中…' : '今天我做成了一件小事'}
          </WarmButton>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="warm-card flex flex-col items-center p-4 text-center animate-fade-in-up"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="mb-2 text-amber">
                <HandDrawnIcon name={s.icon} className="h-6 w-6" />
              </span>
              <span className="text-2xl font-extrabold text-ink">{loading ? '–' : s.value}</span>
              <span className="text-xs text-ink/45">{s.unit}</span>
              <span className="mt-1.5 text-[11px] leading-tight text-ink/55">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ===== 温暖总结 ===== */}
        <div className="mt-8 rounded-3xl bg-cream-50/70 p-6 text-center shadow-soft">
          <p className="font-hand text-xl leading-relaxed text-ink/80">
            这一周，你 <span className="text-amber font-bold">{insights?.blindspotCount ?? 0}</span> 次
            停下来看了看 AI 背后的机制。
            <br />
            那是你清醒的时刻。
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink/35">
          花园会慢慢长，你也是。
        </p>
      </div>
    </div>
  )
}

/* ============ 手绘小花园（根据阶段切换） ============ */
function Garden({ stage }: { stage: string }) {
  return (
    <svg viewBox="0 0 160 140" className="h-36 w-44" aria-hidden="true">
      {/* 土壤 */}
      <ellipse cx="80" cy="120" rx="55" ry="12" fill="#C9A26B" opacity="0.7" />
      <path d="M30 118 Q80 112 130 118 L128 126 Q80 132 32 126 Z" fill="#9C7B4A" opacity="0.6" />

      {stage === 'seed' && (
        <g>
          {/* 种子 */}
          <ellipse cx="80" cy="112" rx="7" ry="5" fill="#7FA176" />
          <path d="M80 107 Q82 102 78 99" fill="none" stroke="#A8C5A0" strokeWidth="2" />
        </g>
      )}

      {stage === 'sprout' && (
        <g>
          {/* 嫩芽 */}
          <path d="M80 116 L80 90" stroke="#7FA176" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 100 C72 96 70 88 76 84 C80 88 80 96 80 100Z" fill="#A8C5A0" />
          <path d="M80 95 C88 91 90 84 84 80 C80 84 80 91 80 95Z" fill="#A8C5A0" />
        </g>
      )}

      {stage === 'leaf' && (
        <g>
          <path d="M80 116 L80 70" stroke="#7FA176" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 100 C66 94 62 82 72 76 C78 84 80 94 80 100Z" fill="#A8C5A0" />
          <path d="M80 88 C94 82 98 70 88 64 C82 72 80 82 80 88Z" fill="#A8C5A0" />
          <path d="M80 75 C70 71 66 62 74 58 C78 64 80 71 80 75Z" fill="#CFE0C9" />
        </g>
      )}

      {stage === 'flower' && (
        <g>
          <path d="M80 116 L80 55" stroke="#7FA176" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 98 C66 92 62 80 72 74 C78 82 80 92 80 98Z" fill="#A8C5A0" />
          <path d="M80 82 C94 76 98 64 88 58 C82 66 80 76 80 82Z" fill="#A8C5A0" />
          {/* 花 */}
          <g transform="translate(80 50)">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-11"
                rx="6"
                ry="9"
                fill="#FFB347"
                opacity="0.9"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#FFD699" />
          </g>
          {/* 光点 */}
          <circle cx="50" cy="40" r="1.5" fill="#FFD699" opacity="0.8" />
          <circle cx="115" cy="55" r="1.2" fill="#FFD699" opacity="0.7" />
          <circle cx="40" cy="70" r="1" fill="#FFD699" opacity="0.6" />
        </g>
      )}

      {/* 太阳/月光 */}
      <circle cx="130" cy="28" r="10" fill="#FFD699" opacity="0.5" />
      <circle cx="130" cy="28" r="6" fill="#FFB347" opacity="0.6" />
    </svg>
  )
}
