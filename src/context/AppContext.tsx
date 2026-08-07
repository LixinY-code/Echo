/**
 * 全局应用状态
 * 用 React Context 管理：当前会话 ID、完成的 quest 计数、侧边栏状态等
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getLocalQuestCount } from '@/services/api'

interface AppState {
  /** 当前聊天会话 ID（由后端返回，首次发送后建立） */
  sessionId: string | null
  setSessionId: (id: string | null) => void

  /** 已完成的现实任务数 */
  questCount: number
  refreshQuestCount: () => void
  bumpQuestCount: () => void

  /** 侧边栏展开状态 */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  /** 当前选中的多会话 ID（用于切换历史对话） */
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void

  /** 全局呼吸引导弹层（由顶部按钮或聊天页温柔提醒打开） */
  breathingOpen: boolean
  openBreathing: () => void
  closeBreathing: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questCount, setQuestCount] = useState<number>(getLocalQuestCount())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [breathingOpen, setBreathingOpen] = useState(false)

  const refreshQuestCount = useCallback(() => {
    setQuestCount(getLocalQuestCount())
  }, [])

  const bumpQuestCount = useCallback(() => {
    setQuestCount((c) => c + 1)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const openBreathing = useCallback(() => setBreathingOpen(true), [])
  const closeBreathing = useCallback(() => setBreathingOpen(false), [])

  return (
    <AppContext.Provider
      value={{
        sessionId,
        setSessionId,
        questCount,
        refreshQuestCount,
        bumpQuestCount,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        activeChatId,
        setActiveChatId,
        breathingOpen,
        openBreathing,
        closeBreathing,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

/** 使用全局状态的 hook */
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用')
  return ctx
}
