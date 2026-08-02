/**
 * BlindspotGardenPage — 盲点花园（/corner/blindspot-garden）
 *
 * 定位：微任务式体验。把 Response Mirror 里 AI 坦诚的"可能盲点"
 * 种下，靠后续的反思行为（再次查看 / 写日记 / 换框模式）养大。
 *
 * 设计约束（严格遵守）：
 *  - 不出现任何数字、积分、排行榜
 *  - 只通过植物生长状态（种子→发芽→成熟）呈现反馈
 *  - 成熟植物命名格式：「盲点主题·植物名」
 *  - 温柔、非竞争性的视觉调性
 */
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getBlindspotGarden } from '@/services/api'
import type { BlindspotSeed } from '@/types'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import BlindspotPlant from '@/components/common/BlindspotPlant'

export default function BlindspotGardenPage() {
  const [seeds, setSeeds] = useState<BlindspotSeed[]>([])
  const [loading, setLoading] = useState(true)
  /** 当前展开提示语的植物 id */
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const list = await getBlindspotGarden()
      setSeeds(list)
    } catch (e) {
      console.warn('[garden] 加载失败：', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const hasMature = seeds.some((s) => s.stage === 'mature')

  return (
    <div className="min-h-[calc(100vh-61px)] bg-gradient-to-b from-[#F4F8F0] via-[#FBF6EC] to-[#F5E6D3]/50">
      {/* ===== 顶部栏 ===== */}
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-4">
        <button
          onClick={() => window.history.back()}
          aria-label="返回"
          className="interactive-hover flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft text-milkBrown transition-all duration-300"
        >
          <HandDrawnIcon name="arrow-left" className="h-5 w-5" />
        </button>
        <Link
          to="/corner"
          className="interactive-hover flex h-10 items-center gap-1.5 rounded-full bg-white px-4 shadow-soft text-xs text-milkBrown/70 transition-all duration-300 hover:text-milkBrown"
        >
          <HandDrawnIcon name="sprout-green" className="h-4 w-4" />
          我的角落
        </Link>
      </div>

      {/* ===== 标题 ===== */}
      <header className="mx-auto max-w-lg px-4 pt-5 pb-6 text-center">
        <h1 className="font-serif text-3xl font-bold italic text-milkBrown mb-2">
          盲点花园 🌱
        </h1>
        <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-milkBrown/55">
          AI 坦白说「我可能没看到」的那些地方，
          <br />
          你用后来的每一次回想，把它们养大。
        </p>
      </header>

      {/* ===== 花园本体 ===== */}
      <main className="mx-auto max-w-lg px-4 pb-16">
        {loading ? (
          <div className="py-16 text-center text-hint text-sm">花园里起雾了，稍等…</div>
        ) : seeds.length === 0 ? (
          /* ---- 空花园 ---- */
          <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-milkBrown/15 bg-white/60 px-6 py-12 text-center">
            <div className="mx-auto mb-4 h-20 w-20 opacity-70">
              <BlindspotPlant stage="seed" className="h-full w-full" />
            </div>
            <p className="text-sm leading-relaxed text-milkBrown/70">
              这里还空着。
            </p>
            <p className="mt-2 text-xs leading-relaxed text-hint">
              下次聊天时，点开「AI 为什么这样回」，
              <br />
              在「我可能没看到的地方」把一句话种下来。
            </p>
          </div>
        ) : (
          <>
            {/* ---- 植物阵列（柔和有机排布） ---- */}
            <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-6 rounded-3xl bg-white/50 px-4 py-8 shadow-inner-soft">
              {seeds.map((seed, i) => {
                const isMature = seed.stage === 'mature'
                const isOpen = openMessageId === seed.id
                return (
                  <div
                    key={seed.id}
                    className="relative flex w-[30%] min-w-[96px] flex-col items-center"
                    style={{ transform: `translateY(${(i % 3) * 4}px)` }}
                  >
                    {/* 成熟提示语气泡（点击展开） */}
                    {isMature && isOpen && (
                      <div className="absolute -top-24 left-1/2 z-20 w-52 -translate-x-1/2 animate-fade-in rounded-2xl border border-milkBrown/8 bg-white/95 px-4 py-3 shadow-soft-lg backdrop-blur-sm">
                        <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-milkBrown/8 bg-white/95" />
                        <p className="text-[11.5px] leading-relaxed text-milkBrown/85">
                          {seed.message}
                        </p>
                        {/* 原始盲点（极轻展示，不强调） */}
                        <p className="mt-1.5 text-[10px] leading-relaxed text-hint/70 line-clamp-2">
                          种自：{seed.blindspotText}
                        </p>
                      </div>
                    )}

                    {/* 植物本体 */}
                    <button
                      onClick={() => isMature && setOpenMessageId(isOpen ? null : seed.id)}
                      aria-label={
                        isMature
                          ? `${seed.theme}·${seed.plantName}，查看提示语`
                          : seed.stage === 'sprout'
                            ? '正在发芽的盲点'
                            : '刚种下的盲点种子'
                      }
                      className={`group block w-full ${isMature ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <BlindspotPlant
                        stage={seed.stage}
                        plantName={seed.plantName}
                        className={`mx-auto h-24 w-full transition-transform duration-500 ${
                          isMature ? 'group-hover:scale-105 drop-shadow-sm' : ''
                        }`}
                      />
                    </button>

                    {/* 名牌：只有成熟植物有名字（无数字，纯生命感） */}
                    {isMature ? (
                      <p className="mt-1.5 text-center font-hand text-[15px] leading-tight text-milkBrown">
                        {seed.theme}·{seed.plantName}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-center text-[10px] text-hint/60">
                        {seed.stage === 'sprout' ? '悄悄发芽了' : '一颗种子'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ---- 底部文案（无数字反馈） ---- */}
            <p className="mt-6 text-center text-xs leading-relaxed text-hint/75">
              {hasMature
                ? '每一株有名字的植物，都是你跳出单一叙事的一次。'
                : '再次查看它、在日记里提起它、或试试换框模式——它都会悄悄长大。'}
            </p>
          </>
        )}
      </main>
    </div>
  )
}
