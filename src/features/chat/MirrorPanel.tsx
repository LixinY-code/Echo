/**
 * MirrorPanel — Response Mirror 透明化面板
 * "AI 为什么这样说" 展示 AI 的推理过程。
 * 四段式结构化分析，无图标，口语化标题：
 * 1. {t('mirror.signals')}（情绪标签）
 * 2. {t('mirror.strategy')}（回应策略）
 * 3. {t('mirror.blindspots')}（盲点列表 + 「种下这个盲点」）
 * 4. {t('mirror.limitation')}（限制声明，斜体）
 *
 * 盲点花园联动：
 *  - 每条盲点旁有「种下」按钮 → 存入 /corner/blindspot-garden
 *  - 面板展开 = "再次查看"：对已种下的盲点静默触发成长（每天一次）
 *  - 若本次查看让它成熟，显示一句轻柔的彩蛋提示
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MirrorData } from '@/types'
import { plantBlindspot, getBlindspotGarden, growBlindspot } from '@/services/api'
import { useLang } from '@/i18n'

interface Props {
  data: MirrorData
  /** 来源会话 id（种下时记录，用于成熟提示语） */
  sessionId?: string
}

export default function MirrorPanel({ data, sessionId }: Props) {
  const { t } = useLang()
  /** 已种下的盲点文本集合 */
  const [planted, setPlanted] = useState<Set<string>>(new Set())
  /** 正在种下的盲点文本 */
  const [plantingText, setPlantingText] = useState<string | null>(null)
  /** 刚种下的反馈（"已种下 🌱"） */
  const [justPlanted, setJustPlanted] = useState<string | null>(null)
  /** 查看触发成熟的彩蛋提示 */
  const [matureHint, setMatureHint] = useState<string | null>(null)
  /** 防止重复触发 view 成长 */
  const viewFiredRef = useRef(false)

  // 面板展开 = 再次查看：加载已种下列表，并对已种盲点静默触发成长
  useEffect(() => {
    if (viewFiredRef.current) return
    viewFiredRef.current = true
    let cancelled = false

    getBlindspotGarden()
      .then(async (seeds) => {
        if (cancelled) return
        const plantedSet = new Set(seeds.map((s) => s.blindspotText))
        setPlanted(plantedSet)

        // 对本面板中已种下的盲点，触发"再次查看"成长
        for (const text of data.blindspots) {
          if (plantedSet.has(text)) {
            const newlyMatured = await growBlindspot('view', { text })
            if (!cancelled && newlyMatured.length > 0) {
              setMatureHint(t('mirror.maturedHint', { name: newlyMatured[0].plantName || '' }))
              setTimeout(() => setMatureHint(null), 4000)
            }
          }
        }
      })
      .catch(() => { /* 彩蛋功能，失败静默 */ })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 种下这个盲点 */
  const handlePlant = async (text: string) => {
    if (plantingText) return
    setPlantingText(text)
    try {
      const res = await plantBlindspot(text, sessionId)
      setPlanted((prev) => new Set(prev).add(text))
      if (!res.already) {
        setJustPlanted(text)
        setTimeout(() => setJustPlanted(null), 2600)
      }
    } catch { /* 静默 */ } finally {
      setPlantingText(null)
    }
  }

  return (
    <div className="paper-blur mt-2 overflow-hidden rounded-2xl border border-ink/5 shadow-soft">
      <div className="space-y-4 p-5">
        {/* ===== 画像记忆引用（可选） ===== */}
        {data.profileContext && (
          <div className="line-reveal rounded-xl bg-amber-light/20 px-4 py-3" style={{ animationDelay: '0ms' }}>
            <p className="text-[13px] leading-relaxed text-ink/65 italic">
              {data.profileContext}
            </p>
          </div>
        )}

        {/* 1. {t('mirror.signals')} */}
        <section className="line-reveal" style={{ animationDelay: data.profileContext ? '60ms' : '0ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            {t('mirror.signals')}
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

        {/* 2. {t('mirror.strategy')} */}
        <section className="line-reveal" style={{ animationDelay: (data.profileContext ? 150 : 90) + 'ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            {t('mirror.strategy')}
          </h3>
          <p className="text-[15px] leading-relaxed text-ink/70">
            {data.strategy}
          </p>
        </section>

        {/* 3. {t('mirror.blindspots')}（可种下） */}
        <section className="line-reveal" style={{ animationDelay: (data.profileContext ? 240 : 180) + 'ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            {t('mirror.blindspots')}
          </h3>
          <ul className="space-y-2.5">
            {data.blindspots.map((text, i) => {
              const isPlanted = planted.has(text)
              const isJustPlanted = justPlanted === text
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <p className="flex-1 text-[15px] leading-relaxed text-ink/70">
                    {text}
                  </p>
                  {isPlanted ? (
                    <span
                      className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] transition-all duration-500 ${
                        isJustPlanted
                          ? 'bg-sage/25 text-sage-deep animate-fade-in'
                          : 'bg-sage/10 text-sage-deep/70'
                      }`}
                    >
                      {isJustPlanted ? t('mirror.justPlanted') : t('mirror.planted')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePlant(text)}
                      disabled={plantingText !== null}
                      title={t('mirror.plantTitle')}
                      className="group mt-0.5 flex flex-shrink-0 items-center gap-1 rounded-full border border-sage/30 bg-sage/5 px-2.5 py-1 text-[11px] text-sage-deep transition-all duration-300 hover:border-sage/50 hover:bg-sage/15 hover:shadow-soft disabled:opacity-50"
                    >
                      {/* 小种子图标 */}
                      <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                        <ellipse cx="6" cy="7.5" rx="3" ry="2.6" fill="currentColor" opacity="0.55" />
                        <path d="M6 5 Q6.5 2.5 4.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                      {plantingText === text ? t('mirror.planting') : t('mirror.plant')}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          {/* 种下后的轻提示 */}
          {justPlanted && (
            <p className="mt-2 animate-fade-in text-[11px] text-sage-deep/80">
              {t('mirror.plantHint')}
              <Link to="/corner/blindspot-garden" className="ml-1 underline decoration-sage/40 underline-offset-2 hover:text-sage-deep">
                {t('mirror.goGarden')}
              </Link>
            </p>
          )}

          {/* 查看触发成熟的彩蛋 */}
          {matureHint && (
            <p className="mt-2 animate-fade-in rounded-xl bg-sage/10 px-3 py-2 text-[11px] leading-relaxed text-sage-deep">
              🌱 {matureHint}
            </p>
          )}
        </section>

        {/* 4. {t('mirror.limitation')} */}
        <section className="line-reveal" style={{ animationDelay: (data.profileContext ? 330 : 270) + 'ms' }}>
          <h3 className="mb-2.5 text-sm font-bold text-ink/80">
            {t('mirror.limitation')}
          </h3>
          <p className="text-[15px] italic leading-relaxed text-ink/55">
            {data.limitation}
          </p>
        </section>
      </div>
    </div>
  )
}
