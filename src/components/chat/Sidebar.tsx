/**
 * Sidebar — 聊天记录侧边栏（Echo v4.0 情绪果实版）
 *
 * 功能：
 *  - 展示历史聊天会话列表（倒序，最近在前）
 *  - 新建聊天
 *  - 侧边栏展开/收起切换
 *  - 点击切换会话
 *  - 删除会话
 *  - 显示总结预览 + 情绪果实小图标
 *
 * v4.0 更新：
 *  - 每个会话卡片旁显示小圆点颜色（对应情绪果实颜色）
 *  - 支持扩展 emotionType 字段
 */
import { useEffect, useState, useCallback } from 'react'
import type { ChatSession } from '@/types'
import {
  getSessions,
  createSession,
  deleteSession,
} from '@/services/api'
import { useLang, localeOf } from '@/i18n'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import EchoLogo from '@/components/common/EchoLogo'

interface Props {
  /** 当前活跃会话 ID */
  activeSessionId: string | null
  /** 切换会话回调 */
  onSwitchSession: (sessionId: string | null) => void
  /** 侧边栏是否展开 */
  open: boolean
  /** 切换展开状态 */
  onToggle: () => void
}

export default function Sidebar({
  activeSessionId,
  onSwitchSession,
  open,
  onToggle,
}: Props) {
  const { t, lang } = useLang()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 加载会话列表
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getSessions()
      setSessions(list)
    } catch (e) {
      console.warn('[sidebar] 加载会话列表失败：', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  /** 新建聊天 */
  const handleNewChat = async () => {
    if (creating) return
    setCreating(true)
    try {
      const session = await createSession()
      setSessions((prev) => [session, ...prev])
      onSwitchSession(session.id)
    } catch (e) {
      console.warn('[sidebar] 新建会话失败：', e)
    } finally {
      setCreating(false)
    }
  }

  /** 切换到某个会话 */
  const handleSelect = (id: string) => {
    if (id === activeSessionId) return
    onSwitchSession(id)
  }

  /** 删除会话 */
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // 防止触发选中
    if (deletingId === id) return
    setDeletingId(id)
    try {
      await deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      // 如果删除的是当前活跃会话，切回 null
      if (id === activeSessionId) {
        onSwitchSession(null)
      }
    } catch (e) {
      console.warn('[sidebar] 删除会话失败：', e)
    } finally {
      setDeletingId(null)
    }
  }

  /** 格式化时间显示 */
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return t('sidebar.justNow')
    if (diffMin < 60) return t('sidebar.minAgo', { n: diffMin })
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return t('sidebar.hourAgo', { n: diffHr })
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return t('sidebar.dayAgo', { n: diffDay })
    return d.toLocaleDateString(localeOf(lang), { month: 'short', day: 'numeric' })
  }

  /* ===== 收起态：只显示一个窄条 + 按钮 ===== */
  if (!open) {
    return (
      <div className="flex h-full w-0 flex-col overflow-hidden transition-all duration-300 ease-soft">
        {/* v2.0 浮动展开按钮（浅杏色） */}
        <button
          onClick={onToggle}
          aria-label={t('sidebar.expand')}
          title={t('chat.history')}
          className="fixed left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-xl bg-apricot/60 px-1.5 py-3 shadow-soft transition-all duration-200 hover:bg-apricot hover:shadow-glow"
        >
          <HandDrawnIcon name="chat-bubble" className="h-5 w-5 text-milkBrown" />
        </button>
      </div>
    )
  }

  /* ===== 展开态（v2.0 浅杏色背景） ===== */
  return (
    <div className="flex h-full w-[260px] flex-shrink-0 flex-col border-r border-milkBrown/10 bg-apricot/20 backdrop-blur-sm transition-all duration-300 ease-soft">
      {/* 头部：标题 + 新建 + 收起 */}
      <div className="flex items-center justify-between border-b border-milkBrown/8 px-4 py-3">
        <h2 className="text-sm font-semibold text-milkBrown">{t('sidebar.title')}</h2>
        <div className="flex items-center gap-1">
          {/* 新建 */}
          <button
            onClick={handleNewChat}
            disabled={creating}
            aria-label={t('sidebar.new')}
            title={t('sidebar.new')}
            className="interactive-hover flex h-7 w-7 items-center justify-center rounded-lg text-milkBrown/50 transition-all duration-200 hover:bg-apricot/40 hover:text-milkBrown disabled:opacity-40"
          >
            <HandDrawnIcon
              name={creating ? 'spinner' : 'plus'}
              className={`h-4 w-4 ${creating ? 'animate-spin' : ''}`}
            />
          </button>
          {/* 收起 */}
          <button
            onClick={onToggle}
            aria-label={t('sidebar.collapse')}
            title={t('sidebar.collapse')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-milkBrown/40 transition-all duration-200 hover:bg-apricot/30 hover:text-milkBrown"
          >
            <HandDrawnIcon name="panel-left-close" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-hint">
            {t('sidebar.loading')}
          </div>
        ) : sessions.length === 0 ? (
          /* 空状态 */
          <div className="px-2 py-10 text-center">
            <EchoLogo size="sm" showText={false} className="mx-auto mb-3 h-16 w-auto opacity-40" />
            <p className="text-xs leading-relaxed text-hint">
              {t('sidebar.empty1')}<br />
              {t('sidebar.empty2')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={`group relative flex w-full flex-col gap-1 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-white shadow-soft ring-1 ring-amber/20' // v2.0 白色卡片选中态
                      : 'hover:bg-apricot/25' // 浅杏色 hover
                  }`}
                >
                  {/* 标题行（v4.0：+ 情绪果实小圆点） */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* v4.0：情绪果实颜色指示器 */}
                      {s.emotionColor && (
                        <span
                          className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: s.emotionColor }}
                          title={s.emotionType || '已分析'}
                        />
                      )}
                      <span
                        className={`line-clamp-1 text-[13px] font-medium leading-tight ${
                          isActive ? 'text-milkBrown' : 'text-milkBrown/70'
                        }`}
                      >
                        {s.title || t('sidebar.defaultTitle')}
                      </span>
                    </div>
                    {/* 删除按钮（hover 显示） */}
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      disabled={deletingId === s.id}
                      aria-label={t('sidebar.delete')}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 disabled:opacity-50"
                    >
                      <HandDrawnIcon
                        name={deletingId === s.id ? 'spinner' : 'trash'}
                        className={`h-3 w-3 ${deletingId === s.id ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>

                  {/* 元信息行（v2.0 使用 hint 色） */}
                  <div className="flex items-center gap-2 text-[11px] text-hint">
                    <span>{formatTime(s.createdAt)}</span>
                    {s.messageCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{t('sidebar.msgs', { n: s.messageCount })}</span>
                      </>
                    )}
                  </div>

                  {/* 总结预览（有总结时显示） */}
                  {(s.summary || s.fullSummary) && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-hint/80">
                      {s.summary || s.fullSummary}
                    </p>
                  )}

                  {/* 活跃指示条（v2.0 使用 amber 色） */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-amber" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* v2.0 底部：Echo 品牌 Logo */}
      <div className="border-t border-milkBrown/8 px-4 py-3 text-center">
        <EchoLogo size="sm" showText={true} className="mx-auto h-12 w-auto opacity-50 transition-opacity hover:opacity-80" />
      </div>
    </div>
  )
}
