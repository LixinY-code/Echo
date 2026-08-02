/**
 * Echo 全局类型定义
 */

/** AI 透明化面板数据 */
export interface MirrorData {
  /** 检测到的情绪信号关键词（可能含频率标注，如"焦虑（本周第3次）"） */
  signals: string[]
  /** AI 使用的回应策略（含画像引用说明） */
  strategy: string
  /** 可能忽略的视角 */
  blindspots: string[]
  /** 固定限制声明 */
  limitation: string
  /** 可选：Echo 对该用户的画像上下文摘要（如对话次数、近期情绪趋势） */
  profileContext?: string
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

/* ============================================================
 * 会话（Session）—— 多会话管理
 * ============================================================ */

/** 聊天会话 */
export interface ChatSession {
  id: string
  title: string
  createdAt: string // ISO
  updatedAt?: string
  messageCount: number
  summary?: string | null
}

/** 会话列表响应 */
export interface SessionsResponse {
  sessions: ChatSession[]
}

/** 会话消息加载响应 */
export interface SessionMessagesResponse {
  sessionId: string
  messages: ChatMessage[]
}

/** 会话总结响应 */
export interface SessionSummaryResponse {
  summary: string
  summarized: boolean
}

/** 情绪分析响应（EmotionTree 果实） */
export interface EmotionAnalysisResponse {
  emotionType: 'joy' | 'warm' | 'sad' | 'anxious' | 'confused' | 'calm'
  emotionColor: string
  summary300: string
  analyzed: boolean
}

/** 情绪果实数据（来自 /api/emotion-fruits） */
export interface EmotionFruitData {
  sessionId: string
  title: string
  emotionType: EmotionAnalysisResponse['emotionType']
  emotionColor: string
  summary300: string
  messageCount: number
  createdAt: string
  updatedAt?: string
}

/** 情绪果实列表响应 */
export interface EmotionFruitsResponse {
  fruits: EmotionFruitData[]
}

/* ============================================================
 * 微光任务（Glimmer Quests）—— 轻量日常彩蛋
 * ============================================================ */

/** 一个微光任务 */
export interface GlimmerQuest {
  id: string
  questKey: string
  text: string
  emoji: string
  completed: boolean
}

/** 情绪拼图进度（7 个任务 = 1 块碎片，共 9 块） */
export interface GlimmerPuzzle {
  totalCompleted: number
  pieces: number
  progressToNext: number
}

/** 今日微光任务响应 */
export interface GlimmerTodayResponse {
  quests: GlimmerQuest[]
  puzzle: GlimmerPuzzle
}

/** 完成微光任务响应 */
export interface GlimmerCompleteResponse {
  success: boolean
  puzzle: GlimmerPuzzle
  /** 本次完成是否恰好解锁一块新碎片 */
  newPiece: boolean
}

/* ============================================================
 * 盲点花园（Blindspot Garden）—— 把 AI 盲点种成植物
 * ============================================================ */

/** 种子生长阶段（UI 只呈现状态，不展示任何数字） */
export type BlindspotStage = 'seed' | 'sprout' | 'mature'

/** 一颗盲点种子 */
export interface BlindspotSeed {
  id: string
  /** 盲点原文（来自 Response Mirror） */
  blindspotText: string
  /** 主题（命名前半段，种下时提取） */
  theme: string
  /** 植物名（成熟时揭晓） */
  plantName?: string
  stage: BlindspotStage
  /** 成熟后的个性化提示语 */
  message?: string
  plantedAt: string
  maturedAt?: string
}

/** 种下盲点响应 */
export interface BlindspotPlantResponse {
  seed: BlindspotSeed
  /** 是否之前已经种过 */
  already: boolean
}

/** 花园响应 */
export interface BlindspotGardenResponse {
  seeds: BlindspotSeed[]
}

/** 成长触发响应 */
export interface BlindspotGrowResponse {
  /** 本次新成熟的植物（用于彩蛋提示） */
  newlyMatured: BlindspotSeed[]
}
