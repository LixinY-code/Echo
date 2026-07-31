/**
 * Echo API 服务层
 * ----------------------------------------------------------------
 * 统一封装所有后端交互。后端尚未部署前，通过 VITE_USE_MOCK 开关
 * 走前端 mock 数据，保证完整可体验的流程。
 *
 * 切换为真实后端：将 .env 中 VITE_USE_MOCK 改为 false，
 * 并确保 VITE_API_BASE_URL 指向后端地址。
 * ----------------------------------------------------------------
 */
import type {
  ChatResponse,
  Insights,
  JournalEntry,
  LabVersion,
  QuestCompleteResponse,
  Emotion,
  ChatMessage,
  ChatSession,
  SessionsResponse,
  SessionMessagesResponse,
  SessionSummaryResponse,
  EmotionAnalysisResponse,
  EmotionFruitData,
  EmotionFruitsResponse,
} from '@/types'
import { genId } from '@/utils/time'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/** mock 开关：默认开启（后端未就绪时） */
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

/** 模拟网络延迟，让加载动画更真实 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 匿名用户标识：首次生成 UUID 存 localStorage，每次请求带在 X-User-Id 头 */
function getDeviceId(): string {
  const KEY = 'echo_device_id'
  let id: string | null = null
  try {
    id = localStorage.getItem(KEY)
  } catch {
    /* SSR 或隐私模式下 localStorage 不可用 */
  }
  if (!id) {
    id = crypto.randomUUID?.() || genId()
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }
  return id
}

/** 统一请求封装（真实后端用） */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getDeviceId(),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

/* ============================================================
 * Mock 数据 & 生成器
 * ============================================================ */

const MOCK_LIMITATION =
  '这是一个语言模型根据模式生成的回应，并非真实情感体验。'

/** 根据用户消息生成 mock 的 mirror 数据 */
function mockMirror(message: string) {
  const signals: string[] = []
  if (/(累|疲惫|撑不住|辛苦)/.test(message)) signals.push('疲惫')
  if (/(焦虑|担心|怕|害怕|不安)/.test(message)) signals.push('焦虑')
  if (/(孤独|一个人|没人|没朋友)/.test(message)) signals.push('孤独')
  if (/(没用|没价值|失败|不够好|自我怀疑)/.test(message)) signals.push('自我怀疑')
  if (/(失眠|睡不着|睡不好)/.test(message)) signals.push('失眠')
  if (/(压力|学业|考试|论文|deadline)/.test(message)) signals.push('学业压力')
  if (signals.length === 0) signals.push('想要倾诉', '寻求回应')

  const strategies = [
    '先验证你的感受，再用开放式提问引导自我觉察',
    '用陪伴性语言承接情绪，避免急于给建议',
    '反映你话语中的核心情绪，帮助你命名它',
  ]

  const blindspots = [
    '可能忽略了你身边已有的支持系统',
    '没有询问你是否已经尝试过某些方法',
    '把"情绪"当作了"事实"，而你的实际处境可能更复杂',
  ]

  return {
    signals,
    strategy: strategies[Math.floor(Math.random() * strategies.length)],
    blindspots: [blindspots[Math.floor(Math.random() * blindspots.length)]],
    limitation: MOCK_LIMITATION,
  }
}

/** mock 回复文本 */
function mockReply(message: string): string {
  const replies = [
    `谢谢你愿意告诉我这些。你说的「${message.slice(0, 12)}${message.length > 12 ? '…' : ''}」，听起来确实不容易。能多和我说说，这件事对你来说最难受的部分是什么吗？`,
    `我听到了。此刻有这样的感受是合理的，不需要急着把它赶走。如果用一个画面来形容现在的感觉，你会怎么描述它？`,
    `嗯，我在。你说的这些不是小事，它们积累起来确实会让人喘不过气。今天，你是更想被理解，还是想一起想想办法？`,
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

/** mock lab 三种风格回复 */
function mockLabVersions(_message: string): LabVersion[] {
  return [
    {
      style: '安慰模式',
      description: '温柔陪伴',
      text: `我知道现在很难，你已经做得很好了。允许自己慢慢来，不用逼自己立刻好起来。`,
    },
    {
      style: '挑战模式',
      description: '温和质疑',
      text: `你说"撑不住了"——这个判断是基于事实，还是疲惫时的感受？如果是朋友说这话，你会怎么回应ta？`,
    },
    {
      style: '换框模式',
      description: '换个角度',
      text: `把"我又没做好"换成"我正在学习做好"。同一件事，换个主语，重量会不一样。`,
    },
  ]
}

/* mock 本地日记存储（localStorage 持久化，让体验连续） */
const JOURNAL_KEY = 'echo_mock_journal'

function loadMockJournals(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  // 初始示例日记
  const seed: JournalEntry[] = [
    {
      id: genId(),
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      emotion: '迷茫',
      preview: '今天和导师聊了研究方向，反而更不确定了……',
      content:
        '今天和导师聊了研究方向，反而更不确定了。语言学和 AI 之间，我到底该往哪边靠？',
    },
  ]
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(seed))
  return seed
}

function saveMockJournals(list: JournalEntry[]) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(list))
}

/* mock quest 计数 */
const QUEST_KEY = 'echo_mock_quest_count'

/* ============================================================
 * 对外 API
 * ============================================================ */

/** 1. 发送聊天消息 */
export async function sendChat(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  if (USE_MOCK) {
    await delay(700 + Math.random() * 600)
    return {
      reply: mockReply(message),
      mirror: mockMirror(message),
      sessionId: sessionId || genId(),
    }
  }
  return request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  })
}

/** 2. 获取多版本回复 */
export async function getLabVersions(
  message: string,
  originalReply?: string,
): Promise<{ versions: LabVersion[] }> {
  if (USE_MOCK) {
    await delay(800 + Math.random() * 500)
    return { versions: mockLabVersions(message) }
  }
  return request<{ versions: LabVersion[] }>('/lab', {
    method: 'POST',
    body: JSON.stringify({ message, originalReply }),
  })
}

/** 3. 获取个人洞察（周报） */
export async function getInsights(): Promise<Insights> {
  if (USE_MOCK) {
    await delay(600)
    return {
      mainTheme: '学业压力与自我否定',
      peakHours: '深夜 23:00 — 01:00',
      dependencySign: '连续 5 天在凌晨 1 点后使用',
      reflection:
        '你似乎一直在寻找确定性。也许这一周，可以试着允许一些"暂时不知道"。',
      completedQuests: parseInt(localStorage.getItem(QUEST_KEY) || '3', 10),
      journalCount: loadMockJournals().length,
      blindspotCount: 4,
    }
  }
  return request<Insights>('/insights', { method: 'GET' })
}

/** 4.1 获取日记列表 */
export async function getJournals(): Promise<JournalEntry[]> {
  if (USE_MOCK) {
    await delay(400)
    return loadMockJournals().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }
  return request<JournalEntry[]>('/journal', { method: 'GET' })
}

/** 4.2 新建日记 */
export async function createJournal(
  content: string,
  emotion: Emotion,
): Promise<JournalEntry> {
  if (USE_MOCK) {
    await delay(400)
    const entry: JournalEntry = {
      id: genId(),
      date: new Date().toISOString(),
      emotion,
      preview: content.slice(0, 60) || '（空白的一页）',
      content,
    }
    const list = loadMockJournals()
    list.push(entry)
    saveMockJournals(list)
    return entry
  }
  return request<JournalEntry>('/journal', {
    method: 'POST',
    body: JSON.stringify({ content, emotion }),
  })
}

/** 4.3 删除日记 */
export async function deleteJournal(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300)
    const list = loadMockJournals().filter((j) => j.id !== id)
    saveMockJournals(list)
    return
  }
  await request<{ success: boolean }>(`/journal/${id}`, { method: 'DELETE' })
}

/** 5. 完成现实任务 */
export async function completeQuest(questId: string): Promise<QuestCompleteResponse> {
  if (USE_MOCK) {
    await delay(300)
    const cur = parseInt(localStorage.getItem(QUEST_KEY) || '0', 10)
    localStorage.setItem(QUEST_KEY, String(cur + 1))
    return { success: true }
  }
  return request<QuestCompleteResponse>('/quest/complete', {
    method: 'POST',
    body: JSON.stringify({ questId }),
  })
}

/** 获取本地 quest 计数（用于角落页即时刷新） */
export function getLocalQuestCount(): number {
  return parseInt(localStorage.getItem(QUEST_KEY) || '0', 10)
}

/* ============================================================
 * 新用户引导问卷（Onboarding）
 * ============================================================ */

const ONBOARDED_KEY = 'echo_onboarded'
const PROFILE_KEY = 'echo_profile'

/** 用户侧写（来自引导问卷，后续用于个性化） */
export interface UserProfile {
  nickname?: string
  personality?: 'I' | 'E'
  tags: string[]
}

/** 是否已完成引导（本地标记，快速判断，避免每次进都要查后端） */
export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true'
  } catch {
    return false
  }
}

/** 保存引导问卷结果（先存本地标记，真实模式再存后端；后端失败不阻塞） */
export async function saveOnboarding(data: UserProfile): Promise<void> {
  try {
    localStorage.setItem(ONBOARDED_KEY, 'true')
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
  if (!USE_MOCK) {
    try {
      await request('/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (e) {
      console.warn('[onboarding] 后端保存失败，已存本地：', e)
    }
  }
}

/** 读取用户侧写（mock 读 localStorage，真实读后端） */
export async function getProfile(): Promise<UserProfile | null> {
  if (USE_MOCK) {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      return raw ? (JSON.parse(raw) as UserProfile) : null
    } catch {
      return null
    }
  }
  try {
    return await request<UserProfile>('/profile')
  } catch {
    return null
  }
}

/** 导出 mock 状态，便于调试 */
export const apiDebug = { USE_MOCK, BASE_URL }

/* ============================================================
 * 会话（Session）管理 API
 * ============================================================ */

const SESSIONS_KEY = 'echo_sessions' // mock 会话列表缓存

/** 获取会话列表 */
export async function getSessions(): Promise<ChatSession[]> {
  if (USE_MOCK) {
    await delay(300)
    try {
      const raw = localStorage.getItem(SESSIONS_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    // 初始示例
    const seed: ChatSession[] = [
      { id: genId(), title: '关于论文的焦虑', createdAt: new Date(Date.now() - 3600000).toISOString(), messageCount: 8, summary: '聊了论文进度的焦虑，用户感到自我怀疑但也在尝试调整。' },
      { id: genId(), title: '深夜的迷茫', createdAt: new Date(Date.now() - 86400000).toISOString(), messageCount: 12, summary: '关于未来方向的困惑，涉及职业选择和兴趣平衡。' },
    ]
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(seed))
    return seed
  }
  const res = await request<SessionsResponse>('/sessions', { method: 'GET' })
  return res.sessions
}

/** 新建会话 */
export async function createSession(title?: string): Promise<ChatSession> {
  if (USE_MOCK) {
    await delay(200)
    const session: ChatSession = {
      id: genId(),
      title: title || '新的对话',
      createdAt: new Date().toISOString(),
      messageCount: 0,
      summary: null,
    }
    // 更新本地缓存
    const list = await getSessions()
    list.unshift(session)
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
    return session
  }
  return request<ChatSession>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

/** 获取会话消息历史 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[] | null> {
  if (USE_MOCK) {
    await delay(300)
    // mock：返回空数组表示新会话，或模拟旧会话数据
    return null // 前端会在 null 时显示空白开场白
  }
  try {
    const res = await request<SessionMessagesResponse>(`/sessions/${sessionId}`, { method: 'GET' })
    return res.messages
  } catch {
    return null
  }
}

/** 更新会话标题 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  if (USE_MOCK) {
    await delay(150)
    const list = await getSessions()
    const s = list.find((x) => x.id === sessionId)
    if (s) s.title = title
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
    return
  }
  await request(`/sessions/${sessionId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  })
}

/** 删除会话 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (USE_MOCK) {
    await delay(200)
    const list = (await getSessions()).filter((s) => s.id !== sessionId)
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(list)) } catch { /* ignore */ }
    return
  }
  await request(`/sessions/${sessionId}`, { method: 'DELETE' })
}

/** 触发 AI 总结会话 */
export async function summarizeSession(sessionId: string): Promise<string | null> {
  if (USE_MOCK) {
    await delay(600)
    return '一次关于「' + (sessionId.slice(0, 6)) + '」的温暖对话。'
  }
  try {
    const res = await request<SessionSummaryResponse>(`/sessions/${sessionId}/summary`, {
      method: 'POST',
    })
    return res.summary
  } catch {
    return null
  }
}

/**
 * 触发情绪分析（EmotionTree 果实）
 * 在对话结束/切换会话时调用，返回情绪类型 + 颜色 + 300字总结
 */
export async function analyzeSessionEmotion(sessionId: string): Promise<EmotionAnalysisResponse | null> {
  if (USE_MOCK) {
    await delay(800)
    // Mock：随机返回一种情绪
    const emotions: EmotionAnalysisResponse['emotionType'][] = ['joy', 'warm', 'sad', 'anxious', 'confused', 'calm']
    const colors: Record<string, string> = {
      joy: '#FFB6C1', warm: '#FFE4D0', sad: '#ADD8E6',
      anxious: '#FFB347', confused: '#E8D5F0', calm: '#98FB98',
    }
    const type = emotions[Math.floor(Math.random() * emotions.length)]
    return {
      emotionType: type,
      emotionColor: colors[type],
      summary300: `这是一次${type === 'joy' ? '愉快' : type === 'warm' ? '温暖' : type === 'sad' ? '有些难过' : type === 'anxious' ? '带着焦虑' : type === 'confused' ? '有些迷茫' : '平静'}的对话。你聊到了一些重要的事情，Echo 一直在这里陪着你。`,
      analyzed: true,
    }
  }
  try {
    return await request<EmotionAnalysisResponse>(`/sessions/${sessionId}/emotion`, {
      method: 'POST',
    })
  } catch {
    return null
  }
}

/**
 * 获取用户所有情绪果实（用于 CornerPage 的 EmotionTree）
 */
export async function getEmotionFruits(): Promise<EmotionFruitData[]> {
  if (USE_MOCK) {
    await delay(400)
    // Mock：返回示例果实数据
    return [
      {
        sessionId: 'mock-1',
        title: '关于论文的焦虑',
        emotionType: 'anxious',
        emotionColor: '#FFB347',
        summary300: '这次你聊了论文进度的压力。感觉 deadline 越来越近，但进展不如预期。你提到导师的期待让你有些喘不过气，也担心自己是不是"不够好"。其实你已经做了很多，只是此刻被焦虑遮住了视线。',
        messageCount: 8,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        sessionId: 'mock-2',
        title: '深夜的迷茫',
        emotionType: 'confused',
        emotionColor: '#E8D5F0',
        summary300: '今晚你聊了未来的方向。在几个选择之间摇摆不定，不知道该往哪里走。这种不确定感让你有点慌，但也说明你在认真思考自己的人生。不用急着找到答案，慢慢来。',
        messageCount: 12,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        sessionId: 'mock-3',
        title: '今天的小确幸',
        emotionType: 'joy',
        emotionColor: '#FFB6C1',
        summary300: '今天你分享了一件开心的事！虽然只是一个小小的瞬间，但你笑的时候整个世界都亮了。记住这种感觉，它会在其他日子也照亮你。',
        messageCount: 5,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ]
  }
  try {
    const res = await request<EmotionFruitsResponse>('/emotion-fruits', { method: 'GET' })
    return res.fruits
  } catch {
    return []
  }
}
