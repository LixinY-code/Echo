/**
 * JournalPage — 情绪日记
 * - 列表视图：手撕纸张卡片，淡淡横线背景，显示日期/情绪/预览
 * - 编辑视图：情绪标签选择 + 简洁文本域
 * - 完全私密，不用于 AI 分析
 */
import { useEffect, useState, useCallback } from 'react'
import type { JournalEntry, Emotion } from '@/types'
import { getJournals, createJournal, deleteJournal } from '@/services/api'
import { formatDateCN, formatTime } from '@/utils/time'
import HandDrawnIcon, { type IconName } from '@/components/common/HandDrawnIcon'
import WarmButton from '@/components/common/WarmButton'

const EMOTIONS: { value: Emotion; icon: IconName; color: string }[] = [
  { value: '焦虑', icon: 'heart', color: 'bg-apricot-light text-ink' },
  { value: '低落', icon: 'moon', color: 'bg-sage-light text-ink' },
  { value: '平静', icon: 'breath', color: 'bg-cream-200 text-ink' },
  { value: '感激', icon: 'sparkle', color: 'bg-amber-light text-ink' },
  { value: '迷茫', icon: 'compass', color: 'bg-ink/10 text-ink' },
  { value: '希望', icon: 'sun', color: 'bg-amber/30 text-ink' },
]

function emotionMeta(e: Emotion) {
  return EMOTIONS.find((x) => x.value === e) ?? EMOTIONS[0]
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [emotion, setEmotion] = useState<Emotion>('平静')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getJournals()
      setEntries(list)
    } catch {
      /* 友好降级：空列表 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = useCallback(async () => {
    if (!draft.trim() || saving) return
    setSaving(true)
    try {
      await createJournal(draft.trim(), emotion)
      setDraft('')
      setEmotion('平静')
      setEditing(false)
      await load()
    } finally {
      setSaving(false)
    }
  }, [draft, emotion, saving, load])

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteJournal(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    },
    [],
  )

  /* ===== 编辑视图 ===== */
  if (editing) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <button
          onClick={() => setEditing(false)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink/55 transition-colors hover:text-ink"
        >
          <HandDrawnIcon name="arrow-left" className="h-4 w-4" />
          返回
        </button>

        <div className="paper-edge rounded-3xl p-6 shadow-soft">
          <h2 className="mb-1 font-hand text-2xl text-ink/80">今天的一页</h2>
          <p className="mb-5 text-xs text-ink/45">{formatDateCN(new Date())}</p>

          {/* 情绪选择 */}
          <p className="mb-2 text-sm font-semibold text-ink/65">此刻的心情是…</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const active = emotion === e.value
              return (
                <button
                  key={e.value}
                  onClick={() => setEmotion(e.value)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-soft hover:scale-[1.04]',
                    active
                      ? `${e.color} ring-2 ring-amber/40`
                      : 'bg-cream-100 text-ink/55 hover:bg-cream-200',
                  ].join(' ')}
                >
                  <HandDrawnIcon name={e.icon} className="h-3.5 w-3.5" />
                  {e.value}
                </button>
              )
            })}
          </div>

          {/* 文本域 */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={10}
            placeholder="把心里的话慢慢写下来……这里只有你自己能看到。"
            className="w-full resize-none rounded-2xl border border-ink/8 bg-cream-50/60 bg-paper-lines p-4 text-[15px] leading-7 text-ink placeholder:text-ink/35 focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/20"
          />

          <div className="mt-5 flex justify-end gap-3">
            <WarmButton variant="ghost" size="sm" onClick={() => setEditing(false)}>
              不写了
            </WarmButton>
            <WarmButton
              variant="amber"
              size="sm"
              onClick={handleSave}
              disabled={!draft.trim() || saving}
            >
              {saving ? '收存中…' : '收存这一页'}
            </WarmButton>
          </div>
        </div>
      </div>
    )
  }

  /* ===== 列表视图 ===== */
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      {/* 标题 */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="font-hand text-3xl text-ink">情绪日记</h1>
          <p className="mt-1 text-sm text-ink/50">只属于你的纸页，不会被 AI 阅读。</p>
        </div>
        <WarmButton
          variant="primary"
          size="sm"
          onClick={() => setEditing(true)}
          className="!rounded-full"
        >
          <HandDrawnIcon name="plus" className="h-4 w-4" />
          写一页
        </WarmButton>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-cream-200/60" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyJournal onCreate={() => setEditing(true)} />
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => {
            const meta = emotionMeta(entry.emotion)
            return (
              <div
                key={entry.id}
                className="paper-edge group relative animate-fade-in-up rounded-3xl p-5 shadow-soft"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* 删除按钮 */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label="删除"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink/30 opacity-0 transition-all duration-300 hover:bg-ink/5 hover:text-ink/60 group-hover:opacity-100"
                >
                  <HandDrawnIcon name="trash" className="h-4 w-4" />
                </button>

                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}
                  >
                    <HandDrawnIcon name={meta.icon} className="h-3 w-3" />
                    {entry.emotion}
                  </span>
                  <span className="text-xs text-ink/45">
                    {formatDateCN(entry.date)} · {formatTime(entry.date)}
                  </span>
                </div>

                <p className="line-clamp-3 text-[15px] leading-relaxed text-ink/75">
                  {entry.preview}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ink/35">
        {entries.length > 0 ? `共 ${entries.length} 页 · 安静地陪你` : ''}
      </p>
    </div>
  )
}

/** 空状态 */
function EmptyJournal({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink/10 bg-cream-50/50 px-6 py-14 text-center">
      <HandDrawnIcon name="journal" className="mb-4 h-12 w-12 text-ink/25" />
      <p className="font-hand text-2xl text-ink/65">还没有写下任何一页</p>
      <p className="mt-2 max-w-xs text-sm text-ink/45">
        不必写得漂亮，哪怕只是一句"今天有点累"，也值得被记下来。
      </p>
      <WarmButton variant="primary" size="sm" className="mt-6" onClick={onCreate}>
        写下第一页
      </WarmButton>
    </div>
  )
}
