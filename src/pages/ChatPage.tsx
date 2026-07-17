/**
 * ChatPage — AI 对话主页面（核心）
 * 功能：
 *  1. 聊天气泡流（用户右 / AI 左）+ 打字机 loading + 错误重试
 *  2. Response Mirror 透明化面板（点击"为什么这样回？"展开）
 *  3. Conversation Lab（"看看 AI 还能怎么回"多版本对比）
 *  4. 呼吸暂停提醒（停留>15min 或深夜 23:00-5:00 触发）
 */
import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react'
import type { ChatMessage } from '@/types'
import { sendChat, getLabVersions } from '@/services/api'
import { useApp } from '@/context/AppContext'
import { genId, isLateNight } from '@/utils/time'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import ChatBubble from '@/features/chat/ChatBubble'
import BreathingOverlay from '@/features/chat/BreathingOverlay'

export default function ChatPage() {
  const { sessionId, setSessionId } = useApp()

  // 初始 AI 开场白（无 mirror，不显示"为什么这样回"）
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: 'ai',
      text: '我在。今天，想聊点什么？',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const breathingShown = useRef(false) // 本次会话是否已弹过呼吸

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

  /* ===== 呼吸暂停提醒：停留 15min 或深夜触发 ===== */
  useEffect(() => {
    const STAY_MS = 15 * 60 * 1000 // 15 分钟
    const timers: number[] = []

    // 停留超时
    const t1 = window.setTimeout(() => {
      if (!breathingShown.current) {
        breathingShown.current = true
        setShowBreathing(true)
      }
    }, STAY_MS)
    timers.push(t1)

    // 深夜时段：进入后 90s 缓缓浮现一次
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
    } catch {
      patchMessage(aiMsg.id, { text: '', error: true })
    } finally {
      setSending(false)
    }
  }, [input, sending, sessionId, setSessionId, patchMessage])

  /** 重试失败的 AI 消息 */
  const handleRetry = useCallback(
    async (id: string) => {
      // 找到该 AI 消息前一条用户消息
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

  /** Conversation Lab：替换最后一条 AI 回复为多版本 */
  const handleShowLab = useCallback(async () => {
    // 找最后一条有文本的 AI 消息
    const lastAi = [...messages].reverse().find((m) => m.role === 'ai' && m.text)
    if (!lastAi) return
    // 找对应的用户消息
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
    } catch {
      patchMessage(lastAi.id, { labLoading: false, labLoaded: true })
    }
  }, [messages, patchMessage])

  /** 是否可显示 Lab 按钮：存在已完成的最后一条 AI 回复 */
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
    <div className="flex h-[calc(100vh-61px)] flex-col bg-cream">
      {/* ===== 消息流 ===== */}
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

      {/* ===== 输入区 ===== */}
      <div className="border-t border-ink/5 bg-cream-50/80 paper-blur px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Conversation Lab 按钮 */}
          {canShowLab && (
            <div className="mb-2 flex justify-center">
              <button
                onClick={handleShowLab}
                className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage-light/40 px-4 py-1.5 text-xs font-semibold text-sage-deep transition-all duration-300 ease-soft hover:scale-[1.03] hover:bg-sage-light"
              >
                <HandDrawnIcon name="sparkle" className="h-3.5 w-3.5" />
                看看 AI 还能怎么回
              </button>
            </div>
          )}

          {/* 胶囊输入框 */}
          <div className="flex items-end gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 shadow-soft transition-all duration-300 focus-within:border-amber/50 focus-within:shadow-glow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="想说点什么……就敲在这里"
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-none"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              aria-label="发送"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-apricot text-ink transition-all duration-300 ease-soft hover:scale-105 hover:bg-apricot-light hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <HandDrawnIcon name="paper-plane" className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-ink/30">
            Enter 发送 · Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* ===== 呼吸暂停提醒 ===== */}
      {showBreathing && (
        <BreathingOverlay onClose={() => setShowBreathing(false)} />
      )}
    </div>
  )
}
