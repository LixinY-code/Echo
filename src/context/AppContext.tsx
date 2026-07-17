/**
 * 全局应用状态
 * 用 React Context 管理：当前会话 ID、完成的 quest 计数等
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
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questCount, setQuestCount] = useState<number>(getLocalQuestCount())

  const refreshQuestCount = useCallback(() => {
    setQuestCount(getLocalQuestCount())
  }, [])

  const bumpQuestCount = useCallback(() => {
    setQuestCount((c) => c + 1)
  }, [])

  return (
    <AppContext.Provider
      value={{ sessionId, setSessionId, questCount, refreshQuestCount, bumpQuestCount }}
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
