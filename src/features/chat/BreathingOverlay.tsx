/**
 * BreathingOverlay — 呼吸暂停提醒遮罩
 * 触发条件（由 ChatPage 控制）：停留超过 15 分钟，或 23:00-5:00 深夜时段。
 * - 屏幕中央半透明遮罩 + 脉动柔光圆圈
 * - 文案："不需要解决任何问题，就和自己待一小会儿。"
 * - 可选 30 秒呼吸引导（4-7-8 节奏：吸气4s / 屏息7s / 呼气8s）
 * - "继续聊天"跳过按钮
 * 柔和的不打断提醒，不计入任何统计。
 */
import { useEffect, useRef, useState } from 'react'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'

interface Props {
  onClose: () => void
}

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'

const PHASE_TEXT: Record<Exclude<Phase, 'idle'>, string> = {
  inhale: '慢慢吸气',
  hold: '屏住一会儿',
  exhale: '轻轻呼出',
}

const PHASE_DURATION: Record<Exclude<Phase, 'idle'>, number> = {
  inhale: 4000,
  hold: 7000,
  exhale: 8000,
}

const SCALE: Record<Exclude<Phase, 'idle'>, number> = {
  inhale: 1.15,
  hold: 1.15,
  exhale: 0.78,
}

const DURATION: Record<Exclude<Phase, 'idle'>, number> = {
  inhale: 4000,
  hold: 200, // 屏息保持，过渡很短
  exhale: 8000,
}

/** 一轮 19s，约 2 轮 ≈ 38s ≈ 30s 引导 */
const TOTAL_CYCLES = 2

export default function BreathingOverlay({ onClose }: Props) {
  const [breathing, setBreathing] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [cycle, setCycle] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!breathing) return
    let cancelled = false

    const runCycle = (n: number) => {
      if (cancelled || n >= TOTAL_CYCLES) {
        setPhase('idle')
        setBreathing(false)
        return
      }
      setPhase('inhale')
      const t1 = window.setTimeout(() => {
        setPhase('hold')
        const t2 = window.setTimeout(() => {
          setPhase('exhale')
          const t3 = window.setTimeout(() => {
            setCycle((c) => c + 1)
            runCycle(n + 1)
          }, PHASE_DURATION.exhale)
          timers.current.push(t3)
        }, PHASE_DURATION.hold)
        timers.current.push(t2)
      }, PHASE_DURATION.inhale)
      timers.current.push(t1)
    }

    runCycle(0)
    return () => {
      cancelled = true
      timers.current.forEach((t) => clearTimeout(t))
      timers.current = []
    }
  }, [breathing])

  const activeScale = phase !== 'idle' ? SCALE[phase] : 1
  const activeDuration = phase !== 'idle' ? DURATION[phase] : 600

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center px-8 text-center">
        {/* 脉动柔光圆圈 */}
        <div className="relative mb-10 flex h-56 w-56 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-amber/20 blur-xl"
            style={{
              transform: `scale(${activeScale})`,
              transition: `transform ${activeDuration}ms cubic-bezier(0.4,0,0.2,1)`,
            }}
          />
          <div
            className="absolute inset-6 rounded-full bg-amber/40 blur-md"
            style={{
              transform: `scale(${activeScale})`,
              transition: `transform ${activeDuration}ms cubic-bezier(0.4,0,0.2,1)`,
            }}
          />
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-amber/80 shadow-glow"
            style={{
              transform: `scale(${activeScale * 0.9 + 0.1})`,
              transition: `transform ${activeDuration}ms cubic-bezier(0.4,0,0.2,1)`,
            }}
          >
            <HandDrawnIcon name="breath" className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* 阶段文字 / 主文案 */}
        <div className="min-h-[3.5rem]">
          {breathing && phase !== 'idle' ? (
            <p className="font-hand text-3xl text-ink/80">{PHASE_TEXT[phase]}</p>
          ) : (
            <p className="font-hand text-2xl leading-relaxed text-ink/80">
              不需要解决任何问题，
              <br />
              就和自己待一小会儿。
            </p>
          )}
        </div>

        {/* 按钮 */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {!breathing ? (
            <button
              onClick={() => {
                setCycle(0)
                setBreathing(true)
              }}
              className="inline-flex items-center gap-2 rounded-3xl bg-amber px-7 py-3 font-semibold text-white shadow-glow transition-all duration-300 ease-soft hover:scale-[1.03] hover:bg-amber-light"
            >
              <HandDrawnIcon name="breath" className="h-5 w-5" />
              试试 30 秒呼吸引导
            </button>
          ) : (
            <p className="text-sm text-ink/50">
              第 {Math.min(cycle + 1, TOTAL_CYCLES)} / {TOTAL_CYCLES} 轮 · 跟着圆圈呼吸
            </p>
          )}

          <button
            onClick={onClose}
            className="rounded-2xl px-5 py-2 text-sm font-medium text-ink/55 transition-colors duration-300 hover:bg-ink/5 hover:text-ink"
          >
            继续聊天
          </button>
        </div>
      </div>
    </div>
  )
}
