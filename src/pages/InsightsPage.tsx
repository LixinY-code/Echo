/**
 * InsightsPage — 个人洞察与周报
 * 设计成一封写给你的信：微黄纸张背景，文字逐行淡入。
 * 内容来自后端 /insights。无足够数据时显示空状态插画。
 */
import { useEffect, useState, useCallback } from 'react'
import type { Insights } from '@/types'
import { getInsights } from '@/services/api'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'
import WarmButton from '@/components/common/WarmButton'

interface Row {
  icon: IconName
  label: string
  value: string
  hint?: string
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await getInsights()
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 是否数据不足 → 空状态
  const isEmpty =
    !!data && data.journalCount === 0 && data.completedQuests === 0

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="letter-paper h-96 animate-pulse rounded-3xl shadow-soft" />
      </div>
    )
  }

  // 空状态
  if (!data || isEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="flex flex-col items-center rounded-3xl bg-cream-50 px-6 py-16 text-center shadow-soft">
          <EmptyEnvelope />
          <p className="mt-6 font-hand text-2xl text-ink/70">
            多和 AI 聊聊，
            <br />
            一周后会有一封写给你的信。
          </p>
          <p className="mt-3 text-sm text-ink/45">
            这封信会安静地总结你这一周的情绪主题，没有评判。
          </p>
          <WarmButton variant="ghost" size="sm" className="mt-6" onClick={load}>
            <HandDrawnIcon name="refresh" className="h-4 w-4" />
            再看看
          </WarmButton>
        </div>
      </div>
    )
  }

  // 信件内容
  const rows: Row[] = [
    {
      icon: 'heart',
      label: '本周主要情绪主题',
      value: data.mainTheme,
    },
    {
      icon: 'moon',
      label: 'AI 使用高峰时段',
      value: data.peakHours,
      hint: '深夜使用更频繁，留意一下自己的作息',
    },
    {
      icon: 'sparkle',
      label: '依赖迹象提示',
      value: data.dependencySign,
      hint: '这只是观察，不是诊断',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="letter-paper relative overflow-hidden rounded-3xl p-7 shadow-soft sm:p-9">
        {/* 信纸顶部装饰 */}
        <div className="mb-6 flex items-center gap-2 text-amber">
          <HandDrawnIcon name="insight" className="h-6 w-6" />
          <span className="font-hand text-2xl text-ink/75">写给你的一封信</span>
        </div>

        {/* 开头 */}
        <p
          className="line-reveal mb-5 font-hand text-xl leading-relaxed text-ink/80"
          style={{ animationDelay: '0ms' }}
        >
          亲爱的你，
        </p>

        {/* 数据行：逐行淡入 */}
        <div className="space-y-4">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="line-reveal"
              style={{ animationDelay: `${120 + i * 140}ms` }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-sage-deep">
                  <HandDrawnIcon name={row.icon} className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold tracking-wide text-ink/50">
                  {row.label}
                </span>
              </div>
              <p className="pl-5 text-[15px] leading-relaxed text-ink/80">{row.value}</p>
              {row.hint && (
                <p className="pl-5 pt-0.5 text-xs italic text-ink/40">{row.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* 反思引导 */}
        <div
          className="line-reveal mt-6 rounded-2xl bg-amber-light/25 p-4"
          style={{ animationDelay: `${120 + rows.length * 140}ms` }}
        >
          <div className="mb-1 flex items-center gap-1.5 text-amber">
            <HandDrawnIcon name="sparkle" className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wide text-ink/55">一句反思</span>
          </div>
          <p className="font-hand text-lg leading-relaxed text-ink/80">
            {data.reflection}
          </p>
        </div>

        {/* 落款 */}
        <p
          className="line-reveal mt-7 text-right font-hand text-lg text-ink/65"
          style={{ animationDelay: `${120 + (rows.length + 1) * 140}ms` }}
        >
          —— Echo，在台灯下
        </p>
      </div>

      {/* 刷新 */}
      <div className="mt-6 flex justify-center">
        <WarmButton variant="ghost" size="sm" onClick={load}>
          <HandDrawnIcon name="refresh" className="h-4 w-4" />
          重新读一遍
        </WarmButton>
      </div>
    </div>
  )
}

/** 空信封插画 */
function EmptyEnvelope() {
  return (
    <svg viewBox="0 0 120 100" className="h-28 w-32" aria-hidden="true">
      <rect x="10" y="25" width="100" height="60" rx="6" fill="#FBF4E6" stroke="#4A3F35" strokeWidth="2" />
      <path d="M10 31 L60 65 L110 31" fill="none" stroke="#4A3F35" strokeWidth="2" />
      <path d="M85 40 Q95 35 100 42 Q103 48 96 52" fill="none" stroke="#A8C5A0" strokeWidth="2" opacity="0.6" />
      <circle cx="92" cy="46" r="2" fill="#FFB347" opacity="0.7" />
    </svg>
  )
}
