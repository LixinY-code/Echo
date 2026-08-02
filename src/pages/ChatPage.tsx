/**
 * ChatPage — AI 对话主页面（核心）
 *
 * 功能：
 *  1. 左侧可折叠侧边栏（历史会话列表 / 新建 / 切换）
 *  2. 聊天气泡流（用户右 / AI 左）+ 打字机 loading + 错误重试
 *  3. Response Mirror 透明化面板（点击"为什么这样回？"展开）
 *  4. Conversation Lab（"看看 AI 还能怎么回"多版本对比）
 *  5. 呼吸暂停提醒（停留>15min 或深夜 23:00-5:00 触发）
 *  6. 自动总结（切换/离开时触发）
 */
import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react'
import type { ChatMessage } from '@/types'
import { sendChat, getLabVersions, updateSessionTitle, analyzeSessionEmotion, growBlindspot } from '@/services/api'
import { useApp } from '@/context/AppContext'
import { genId, isLateNight } from '@/utils/time'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import ChatBubble from '@/features/chat/ChatBubble'
import BreathingOverlay from '@/features/chat/BreathingOverlay'
import Sidebar from '@/components/chat/Sidebar'

/** 初始 AI 开场白 */
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: genId(),
    role: 'ai',
    text: '我在。今天，想聊点什么？',
    timestamp: Date.now(),
  },
]

export default function ChatPage() {
  const {
    sessionId,
    setSessionId,
    sidebarOpen,
    toggleSidebar,
    activeChatId,
    setActiveChatId,
  } = useApp()

  // 消息列表
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)

  // 当前会话是否已总结过
  const [summarized, setSummarized] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const breathingShown = useRef(false)
  /** 记录当前会话第一条用户消息，用于自动生成标题 */
  const firstUserMsgRef = useRef<string | null>(null)
  /** 上一次活跃的 chatId，用于检测切换事件 */
  const prevChatIdRef = useRef<string | null>(activeChatId)

  /** 自动滚到底 */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  /* ===== 检测会话切换 → 触发自动总结 + 重置状态 ===== */
  useEffect(() => {
    const prevId = prevChatIdRef.current
    const currId = activeChatId

    // 从一个有消息的会话切走时，触发总结
    if (prevId && prevId !== currId && messages.length > 1 && !summarized) {
      triggerSummary(prevId)
    }

    // 切换到新会话时重置消息
    if (currId !== prevId) {
      setMessages(INITIAL_MESSAGES)
      setSummarized(false)
      firstUserMsgRef.current = null
      setInput('')
    }

    prevChatIdRef.current = currId
  }, [activeChatId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ===== 呼吸暂停提醒 ===== */
  useEffect(() => {
    const STAY_MS = 15 * 60 * 1000
    const timers: number[] = []

    const t1 = window.setTimeout(() => {
      if (!breathingShown.current) {
        breathingShown.current = true
        setShowBreathing(true)
      }
    }, STAY_MS)
    timers.push(t1)

    if (isLateNight()) {
      const t2 = window.setTimeout(() => {
        if (!breathingShown.current) {
          breathingShown.current = true
          setShowBreathing(true)
        }
      }, 90 * 1000)
      timers.push(t2)
    }

    return () => timers.forEach((t) => clearTimeout(t))
  }, [])

  /** 触发情绪分析（不阻塞 UI）—— 替代原来的简单总结 */
  const triggerSummary = useCallback(async (sid: string | null) => {
    if (!sid || sid === 'temp') return
    try {
      // v4.0：使用情绪分析 API（同时生成总结 + 情绪果实数据）
      await analyzeSessionEmotion(sid)
    } catch (e) {
      console.warn('[chat] 情绪分析失败（非阻塞）：', e)
    }
  }, [])

  /** 更新某条消息 */
  const patchMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      )
    },
    [],
  )

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    // 记录第一条用户消息用于标题
    if (!firstUserMsgRef.current) {
      firstUserMsgRef.current = text
    }

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    }
    const aiMsg: ChatMessage = {
      id: genId(),
      role: 'ai',
      text: '',
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput('')
    setSending(true)

    try {
      const res = await sendChat(text, sessionId ?? undefined)
      if (res.sessionId) setSessionId(res.sessionId)
      patchMessage(aiMsg.id, {
        text: res.reply,
        mirror: res.mirror,
      })

      // 用第一条用户消息更新会话标题（仅首次）
      if (firstUserMsgRef.current && sessionId && sessionId !== 'temp') {
        const title = firstUserMsgRef.current.slice(0, 30) + (firstUserMsgRef.current.length > 30 ? '…' : '')
        updateSessionTitle(sessionId, title).catch(() => {})
        firstUserMsgRef.current = null // 只设置一次
      }
    } catch {
      patchMessage(aiMsg.id, { text: '', error: true })
    } finally {
      setSending(false)
    }
  }, [input, sending, sessionId, setSessionId, patchMessage])

  /** 切换会话 */
  const handleSwitchSession = useCallback(async (id: string | null) => {
    // 对当前会话做总结
    if (messages.length > 1 && !summarized && sessionId && sessionId !== 'temp') {
      triggerSummary(sessionId)
    }

    setActiveChatId(id)
    if (id) {
      setSessionId(id)
    } else {
      // 切到"新建"态
      setSessionId(null)
    }
  }, [messages.length, summarized, sessionId, setActiveChatId, setSessionId, triggerSummary])

  /** 重试失败的 AI 消息 */
  const handleRetry = useCallback(
    async (id: string) => {
      const idx = messages.findIndex((m) => m.id === id)
      if (idx < 1) return
      const userText = [...messages].slice(0, idx).reverse().find((m) => m.role === 'user')
      if (!userText) return

      patchMessage(id, { text: '', error: false })
      setSending(true)
      try {
        const res = await sendChat(userText.text, sessionId ?? undefined)
        if (res.sessionId) setSessionId(res.sessionId)
        patchMessage(id, { text: res.reply, mirror: res.mirror })
      } catch {
        patchMessage(id, { text: '', error: true })
      } finally {
        setSending(false)
      }
    },
    [messages, sessionId, setSessionId, patchMessage],
  )

  /** 切换 Mirror 面板 */
  const toggleMirror = useCallback(
    (id: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, mirrorOpen: !m.mirrorOpen } : m)),
      )
    },
    [],
  )

  /** Conversation Lab */
  const handleShowLab = useCallback(async () => {
    const lastAi = [...messages].reverse().find((m) => m.role === 'ai' && m.text)
    if (!lastAi) return
    const idx = messages.findIndex((m) => m.id === lastAi.id)
    const userText = [...messages].slice(0, idx).reverse().find((m) => m.role === 'user')

    patchMessage(lastAi.id, { labLoading: true, labLoaded: true })
    try {
      const { versions } = await getLabVersions(userText?.text || '', lastAi.text)
      patchMessage(lastAi.id, {
        labVersions: versions,
        labLoading: false,
        labLoaded: true,
      })
      // 盲点花园：完成换框模式体验 → 所有未成熟种子 +1（静默彩蛋）
      void growBlindspot('lab')
    } catch {
      patchMessage(lastAi.id, { labLoading: false, labLoaded: true })
    }
  }, [messages, patchMessage])

  const canShowLab = (() => {
    const lastAi = [...messages].reverse().find((m) => m.role === 'ai' && m.text)
    return !!lastAi && !sending
  })()

  /** 输入框自适应 + 回车发送 */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-61px)] bg-cream">
      {/* ===== 左侧边栏（20%） ===== */}
      <Sidebar
        activeSessionId={activeChatId}
        onSwitchSession={handleSwitchSession}
        open={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* ===== 主聊天区（80%） ===== */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* v2.0 顶部标题栏 */}
        <div className="flex items-center gap-3 border-b border-milkBrown/5 bg-paper/50 px-4 py-2.5 sm:px-6">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              aria-label="展开对话历史"
              title="对话历史"
              className="interactive-hover flex h-9 w-9 items-center justify-center rounded-xl text-ink/40 hover:bg-apricot/30 hover:text-milkBrown"
            >
              <HandDrawnIcon name="panel-left-close" className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-semibold text-milkBrown">
              Echo 深夜陪伴你
            </h1>
            {activeChatId && (
              <p className="text-[11px] text-hint">正在倾听你的声音</p>
            )}
          </div>
        </div>

        {/* 消息流 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                message={m}
                onToggleMirror={toggleMirror}
                onRetry={handleRetry}
              />
            ))}
          </div>
        </div>

        {/* ===== v2.0 输入区重设计 ===== */}
        <div className="border-t border-milkBrown/5 bg-paper/80 backdrop-blur-sm px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-2.5">
            {/* Conversation Lab 按钮 — 浅米色小按钮 */}
            {canShowLab && (
              <div className="flex justify-center">
                <button
                  onClick={handleShowLab}
                  className="interactive-hover inline-flex items-center gap-1.5 rounded-full bg-apricot/40 px-4 py-1.5 text-xs font-semibold text-milkBrown transition-all duration-300 ease-soft hover:bg-apricot/60"
                >
                  <HandDrawnIcon name="sparkle" className="h-3.5 w-3.5" />
                  看看 AI 还能怎么回
                </button>
              </div>
            )}

            {/* v2.0 长条大圆角输入框 */}
            <div className="flex items-end gap-2.5 rounded-[28px] border border-milkBrown/10 bg-white px-4 py-2.5 shadow-soft transition-all duration-300 focus-within:border-amber/50 focus-within:shadow-glow focus-within:shadow-amber/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="想说点什么……就敲在这里"
                className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] text-ink placeholder:text-hint focus:outline-none"
                disabled={sending}
              />
              {/* v2.0 圆形浅杏色发送按钮 */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label="发送"
                className="interactive-hover flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-apricot text-milkBrown shadow-soft transition-all duration-300 ease-soft hover:bg-apricot-light hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <HandDrawnIcon name="paper-plane" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 呼吸暂停提醒 */}
      {showBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}
    </div>
  )
}
