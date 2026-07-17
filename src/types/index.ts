/**
 * Echo 全局类型定义
 */

/** AI 透明化面板数据 */
export interface MirrorData {
  /** 检测到的情绪信号关键词 */
  signals: string[]
  /** AI 使用的回应策略 */
  strategy: string
  /** 可能忽略的视角 */
  blindspots: string[]
  /** 固定限制声明 */
  limitation: string
}

/** 聊天消息 */
export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  /** 仅 AI 消息附带，点击"为什么这样回？"时渲染 */
  mirror?: MirrorData
  /** 该消息是否已展开 Mirror 面板 */
  mirrorOpen?: boolean
  /** 多版本对比数据（点击"看看 AI 还能怎么回"后填充） */
  labVersions?: LabVersion[]
  /** lab 是否已加载 */
  labLoaded?: boolean
  /** 是否正在加载 lab */
  labLoading?: boolean
  /** 该 AI 消息是否生成失败（显示蜡烛熄灭 + 重试） */
  error?: boolean
  timestamp: number
}

/** Conversation Lab 多版本回复 */
export interface LabVersion {
  style: string
  description: string
  text: string
}

/** 情绪标签 */
export type Emotion = '焦虑' | '低落' | '平静' | '感激' | '迷茫' | '希望'

/** 日记条目 */
export interface JournalEntry {
  id: string
  date: string // ISO 字符串
  emotion: Emotion
  preview: string
  content?: string
}

/** 个人洞察（周报） */
export interface Insights {
  mainTheme: string
  peakHours: string
  dependencySign: string
  reflection: string
  completedQuests: number
  journalCount: number
  blindspotCount: number
}

/** 发送聊天消息的响应 */
export interface ChatResponse {
  reply: string
  mirror: MirrorData
  sessionId: string
}

/** 完成 Reality Quest 的响应 */
export interface QuestCompleteResponse {
  success: boolean
}
