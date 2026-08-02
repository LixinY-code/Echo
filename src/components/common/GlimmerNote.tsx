import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { getTodayGlimmers, completeGlimmer } from '@/services/api'
import type { GlimmerQuest, GlimmerPuzzle } from '@/types'

/**
 * GlimmerNote — 微光任务小纸条
 *
 * 设计理念：比 Reality Quest 更轻量的日常彩蛋。
 *  - 默认是角落里一张被胶带贴着的折叠小纸条（轻微摇摆吸引注意）
 *  - 点开展开 1-3 个今日任务，做不做都没关系（无"未完成"提示）
 *  - 点「我做了」→ 蒲公英种子飞散动画 → 当天日记自动加一条彩蛋记录
 *  - 每集满 7 个微光解锁一块情绪拼图碎片（🧩 提示）
 *  - 午夜自动更换（后端按日期分桶），未做的任务悄悄消失
 */

/** 蒲公英种子（单颗） */
interface SeedSpec {
  dx: number
  dy: number
  dr: number
  delay: number
  size: number
}

/** 蒲公英飞散动画层（点击「我做了」时在按钮位置爆开） */
function DandelionBurst({ onDone }: { onDone: () => void }) {
  const seeds = useMemo<SeedSpec[]>(
    () =>
      Array.from({ length: 14 }, () => ({
        dx: (Math.random() - 0.5) * 170,
        dy: -45 - Math.random() * 110,
        dr: (Math.random() - 0.5) * 380,
        delay: Math.random() * 0.18,
        size: 5 + Math.random() * 5,
      })),
    [],
  )

  useEffect(() => {
    const t = setTimeout(onDone, 1350)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {seeds.map((s, i) => (
        <svg
          key={i}
          className="absolute animate-seed-fly"
          style={
            {
              left: '50%',
              top: '50%',
              width: s.size,
              height: s.size * 2.2,
              '--dx': `${s.dx}px`,
              '--dy': `${s.dy}px`,
              '--dr': `${s.dr}deg`,
              animationDelay: `${s.delay}s`,
            } as React.CSSProperties
          }
          viewBox="0 0 10 22"
          aria-hidden="true"
        >
          {/* 种子小伞 + 细茎 */}
          <line x1="5" y1="9" x2="5" y2="20" stroke="#A67C52" strokeWidth="1" strokeLinecap="round" />
          <circle cx="5" cy="4.5" r="4" fill="#FFFFFF" opacity="0.85" />
          <circle cx="5" cy="4.5" r="2" fill="#F5E6D3" opacity="0.9" />
        </svg>
      ))}
    </div>
  )
}

/** 拼图进度点（7 个点 = 1 块碎片） */
function PuzzleDots({ puzzle }: { puzzle: GlimmerPuzzle }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-milkBrown/8 pt-2.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              i < puzzle.progressToNext ? 'bg-amber' : 'bg-milkBrown/15'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-hint">
        {puzzle.pieces > 0 ? `🧩 ${puzzle.pieces} 块碎片` : '集满 7 个微光得一块 🧩'}
      </span>
    </div>
  )
}

const GlimmerNote: React.FC = () => {
  const [quests, setQuests] = useState<GlimmerQuest[]>([])
  const [puzzle, setPuzzle] = useState<GlimmerPuzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  /** 正在播放蒲公英动画的任务 id */
  const [burstingId, setBurstingId] = useState<string | null>(null)
  /** 解锁新碎片的庆祝提示 */
  const [showPieceToast, setShowPieceToast] = useState(false)

  useEffect(() => {
    let cancelled = false
    getTodayGlimmers()
      .then((res) => {
        if (cancelled) return
        setQuests(res.quests)
        setPuzzle(res.puzzle)
      })
      .catch((e) => console.warn('[glimmer] 加载失败：', e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const remaining = quests.filter((q) => !q.completed)
  const allDone = quests.length > 0 && remaining.length === 0

  /** 点击「我做了」：先播蒲公英动画，再调接口 */
  const handleComplete = useCallback((quest: GlimmerQuest) => {
    if (burstingId || quest.completed) return
    setBurstingId(quest.id)
  }, [burstingId])

  /** 动画播完 → 调接口 → 更新状态 */
  const handleBurstDone = useCallback(async () => {
    const id = burstingId
    if (!id) return
    setBurstingId(null)
    try {
      const res = await completeGlimmer(id)
      setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, completed: true } : q)))
      setPuzzle(res.puzzle)
      if (res.newPiece) {
        setShowPieceToast(true)
        setTimeout(() => setShowPieceToast(false), 3200)
      }
    } catch (e) {
      console.warn('[glimmer] 完成失败：', e)
      // 接口失败也先标记本地完成（彩蛋功能不给人压力）
      setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, completed: true } : q)))
    }
  }, [burstingId])

  // 没有任务（接口异常等）时不渲染
  if (loading || quests.length === 0) return null

  /* ===== 折叠态：角落里的胶带小纸条 ===== */
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-label="打开今日微光任务"
        className="group fixed bottom-5 right-5 z-40 block"
      >
        <div className="relative animate-note-sway">
          {/* 胶带 */}
          <div
            className="absolute -top-2.5 left-1/2 z-10 h-5 w-14 -translate-x-1/2 -rotate-3 bg-[#F2DCB0]/75 shadow-[0_1px_2px_rgba(166,124,82,0.2)]"
            style={{ clipPath: 'polygon(4% 0, 96% 0, 100% 20%, 98% 100%, 2% 100%, 0 20%)' }}
          />
          <div className="rounded-[3px] bg-[#FFFDF4] px-4 py-2.5 ring-1 ring-milkBrown/8 shadow-[0_8px_24px_-8px_rgba(166,124,82,0.35)] transition-transform duration-300 group-hover:-translate-y-0.5">
            <p className="font-hand text-base leading-none text-milkBrown">
              {allDone ? '🌙 微光已收好' : `✨ 微光任务 ×${remaining.length}`}
            </p>
          </div>
        </div>
      </button>
    )
  }

  /* ===== 展开态：任务纸条 ===== */
  return (
    <div className="fixed bottom-5 right-5 z-40 w-64 animate-slide-up sm:w-72">
      <div className="relative -rotate-1">
        {/* 胶带 */}
        <div
          className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-2 bg-[#F2DCB0]/75 shadow-[0_1px_2px_rgba(166,124,82,0.2)]"
          style={{ clipPath: 'polygon(3% 0, 97% 0, 100% 15%, 98% 100%, 2% 100%, 0 15%)' }}
        />

        <div
          className="rounded-[3px] bg-[#FFFDF4] px-5 pb-4 pt-5 ring-1 ring-milkBrown/8 shadow-[0_14px_36px_-10px_rgba(166,124,82,0.4)]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent 25px, rgba(166,124,82,0.07) 26px)',
          }}
        >
          {/* 头部 */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="font-hand text-xl leading-tight text-milkBrown">今日微光</p>
              <p className="mt-0.5 text-[10px] text-hint">做不做都没关系，它们 midnight 就会悄悄换掉</p>
            </div>
            <button
              onClick={() => setExpanded(false)}
              aria-label="收起"
              className="flex h-6 w-6 items-center justify-center rounded-full text-hint/70 transition-colors hover:bg-apricot/40 hover:text-milkBrown"
            >
              ✕
            </button>
          </div>

          {/* 任务列表 */}
          {allDone ? (
            <div className="py-3 text-center">
              <p className="text-2xl">🌙</p>
              <p className="mt-1 text-xs leading-relaxed text-milkBrown/70">
                今天的微光都收好了。
                <br />
                明天见。
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {quests.map((quest) => (
                <li
                  key={quest.id}
                  className={`relative transition-opacity duration-500 ${
                    quest.completed ? 'opacity-45' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-base leading-none">{quest.emoji}</span>
                    <p
                      className={`flex-1 text-[12.5px] leading-relaxed text-milkBrown/85 ${
                        quest.completed ? 'line-through decoration-milkBrown/30' : ''
                      }`}
                    >
                      {quest.text}
                    </p>
                  </div>

                  {/* 操作区 */}
                  <div className="relative mt-1 flex justify-end">
                    {quest.completed ? (
                      <span className="text-[10px] text-sage-deep">🌱 已收进今天的日记</span>
                    ) : burstingId === quest.id ? (
                      <span className="relative flex h-7 w-16 items-center justify-center">
                        {/* 蒲公英动画从这里爆开 */}
                        <DandelionBurst onDone={handleBurstDone} />
                        <span className="text-[10px] text-hint">飞走啦…</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleComplete(quest)}
                        disabled={burstingId !== null}
                        className="group/btn flex items-center gap-1 rounded-full bg-apricot/60 px-3 py-1 text-[10.5px] font-medium text-milkBrown/80 transition-all duration-300 hover:bg-apricot hover:shadow-soft disabled:opacity-50"
                      >
                        {/* 小蒲公英图标 */}
                        <svg viewBox="0 0 16 16" className="h-3 w-3 transition-transform duration-300 group-hover/btn:rotate-12" aria-hidden="true">
                          <line x1="8" y1="7" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          <circle cx="8" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />
                        </svg>
                        我做了
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 拼图进度 */}
          {puzzle && <div className="mt-3"><PuzzleDots puzzle={puzzle} /></div>}
        </div>

        {/* 解锁新碎片 toast */}
        {showPieceToast && (
          <div className="absolute -top-14 left-1/2 z-20 w-56 -translate-x-1/2 animate-fade-in-up rounded-2xl bg-white/95 px-4 py-2.5 text-center shadow-soft-lg ring-1 ring-amber/30 backdrop-blur-sm">
            <p className="text-[11px] leading-relaxed text-milkBrown">
              🧩 集满 7 个微光，
              <br />
              一块情绪拼图碎片亮起来了
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GlimmerNote
