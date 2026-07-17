/**
 * Onboarding — 新用户引导问卷
 * 首次进入时展示，3 步轻松了解用户：
 *   1. 称呼（昵称）
 *   2. 性格类型（I人 / E人）
 *   3. 关键词自我描述（多选标签）
 * 全程支持跳过，无压力感。完成后回调 onComplete，数据由上层保存。
 */
import { useState } from 'react'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'
import WarmButton from '@/components/common/WarmButton'

export interface OnboardingData {
  nickname?: string
  personality?: 'I' | 'E'
  tags: string[]
}

interface Props {
  onComplete: (data: OnboardingData) => void
}

const KEYWORDS: { label: string; icon: IconName }[] = [
  { label: '安静', icon: 'moon' },
  { label: '好奇', icon: 'sparkle' },
  { label: '容易焦虑', icon: 'heart' },
  { label: '乐观', icon: 'sun' },
  { label: '敏感', icon: 'breath' },
  { label: '理性', icon: 'compass' },
  { label: '夜猫子', icon: 'moon' },
  { label: '完美主义', icon: 'eye' },
  { label: '慢热', icon: 'sprout' },
  { label: '重感情', icon: 'heart' },
  { label: '独立', icon: 'leaf' },
  { label: '容易想太多', icon: 'compass' },
  { label: '温柔', icon: 'flower' },
  { label: '固执', icon: 'leaf' },
  { label: '乐于倾听', icon: 'breath' },
]

const PERSONALITIES: {
  value: 'I' | 'E'
  title: string
  desc: string
  icon: IconName
}[] = [
  {
    value: 'I',
    title: 'I 人 · 内向型',
    desc: '喜欢安静，能量来自独处和深度思考',
    icon: 'moon',
  },
  {
    value: 'E',
    title: 'E 人 · 外向型',
    desc: '喜欢交流，能量来自人群和新鲜事',
    icon: 'sun',
  },
]

const STEPS = ['称呼', '性格', '关键词']

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [personality, setPersonality] = useState<'I' | 'E' | ''>('')
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (t: string) => {
    setTags((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : prev.length >= 5
          ? prev
          : [...prev, t],
    )
  }

  const next = () => setStep((s) => Math.min(s + 1, 2))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const finish = (skipped = false) => {
    onComplete({
      nickname: skipped ? undefined : nickname.trim() || undefined,
      personality: skipped ? undefined : (personality || undefined),
      tags: skipped ? [] : tags,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream px-5">
      <div className="w-full max-w-md">
        {/* 顶部：Echo 标识 + 进度 */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2 text-amber">
            <HandDrawnIcon name="mirror" className="h-7 w-7" />
            <span className="text-2xl font-extrabold tracking-wide text-ink">Echo</span>
          </div>
          {/* 进度点 */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === step
                    ? 'w-8 bg-amber'
                    : i < step
                      ? 'w-2 bg-sage'
                      : 'w-2 bg-ink/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 主体卡片 */}
        <div
          key={step}
          className="warm-card animate-fade-in-up p-7"
        >
          {/* ===== 步骤 0：称呼 ===== */}
          {step === 0 && (
            <div>
              <h2 className="font-hand text-3xl text-ink">想让我怎么称呼你？</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                随便一个你喜欢的名字就好，不用真名。当然，不想说也行。
              </p>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                autoFocus
                placeholder="比如：小林"
                className="mt-5 w-full rounded-2xl border border-ink/10 bg-cream-50 px-4 py-3 text-lg text-ink placeholder:text-ink/30 focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/20"
              />
            </div>
          )}

          {/* ===== 步骤 1：性格 ===== */}
          {step === 1 && (
            <div>
              <h2 className="font-hand text-3xl text-ink">你觉得自己更接近哪一种？</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                没有标准答案，只是帮我看你怎么陪你比较舒服。
              </p>
              <div className="mt-5 space-y-3">
                {PERSONALITIES.map((p) => {
                  const active = personality === p.value
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPersonality(p.value)}
                      className={[
                        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ease-soft',
                        active
                          ? 'border-amber bg-amber-light/30 shadow-glow'
                          : 'border-ink/10 bg-cream-50 hover:border-sage/40 hover:bg-cream-100',
                      ].join(' ')}
                    >
                      <span
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                          active ? 'bg-amber text-white' : 'bg-sage-light/50 text-sage-deep'
                        }`}
                      >
                        <HandDrawnIcon name={p.icon} className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{p.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{p.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== 步骤 2：关键词 ===== */}
          {step === 2 && (
            <div>
              <h2 className="font-hand text-3xl text-ink">挑几个词形容自己吧</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                选 0-5 个就好，帮我更懂你。也可以都跳过。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {KEYWORDS.map((k) => {
                  const active = tags.includes(k.label)
                  const disabled = !active && tags.length >= 5
                  return (
                    <button
                      key={k.label}
                      onClick={() => toggleTag(k.label)}
                      disabled={disabled}
                      className={[
                        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300 ease-soft',
                        active
                          ? 'bg-apricot text-ink shadow-soft'
                          : disabled
                            ? 'cursor-not-allowed bg-cream-100 text-ink/25'
                            : 'bg-cream-50 text-ink/60 hover:bg-apricot-light/50 hover:text-ink',
                      ].join(' ')}
                    >
                      <HandDrawnIcon name={k.icon} className="h-3.5 w-3.5" />
                      {k.label}
                    </button>
                  )
                })}
              </div>
              {tags.length > 0 && (
                <p className="mt-4 text-xs text-ink/45">已选 {tags.length} / 5</p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex items-center justify-between">
          {/* 左：跳过 / 上一步 */}
          {step === 0 ? (
            <button
              onClick={() => finish(true)}
              className="text-sm text-ink/45 transition-colors hover:text-ink/70"
            >
              全部跳过
            </button>
          ) : (
            <button
              onClick={back}
              className="inline-flex items-center gap-1 text-sm text-ink/55 transition-colors hover:text-ink"
            >
              <HandDrawnIcon name="arrow-left" className="h-4 w-4" />
              上一步
            </button>
          )}

          {/* 右：下一步 / 完成 */}
          {step < 2 ? (
            <WarmButton variant="primary" size="sm" onClick={next}>
              继续
            </WarmButton>
          ) : (
            <WarmButton variant="amber" size="sm" onClick={() => finish(false)}>
              <HandDrawnIcon name="paper-plane" className="h-4 w-4" />
              {tags.length > 0 || nickname || personality ? '好了，开始吧' : '直接开始'}
            </WarmButton>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-ink/30">
          这些信息只有你能看到，用来让 Echo 更懂你。
        </p>
      </div>
    </div>
  )
}
