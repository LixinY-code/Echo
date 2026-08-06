// DeepSeek 调用封装（CommonJS）
// DeepSeek API 与 OpenAI 兼容，复用 openai SDK，仅改 baseURL。
// 用 dynamic import 加载 openai（兼容 ESM/CJS）。API Key 仅服务端。
// generateReply 接收用户侧写注入 prompt，并返回 profile_update 用于更新侧写。

const { CHAT_PROMPT, LAB_PROMPT, SUMMARY_PROMPT, EMOTION_ANALYSIS_PROMPT } = require('./prompts')

const FALLBACK_LIMITATION =
  '这是一个语言模型根据模式生成的回应，并非真实情感体验。'

let _client = null

async function getClient() {
  if (_client) return _client
  const { default: OpenAI } = await import('openai')
  _client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  })
  return _client
}

/** 把用户画像对象格式化成 prompt 可读的文本摘要 */
function formatProfile(profile) {
  if (!profile) return '（暂无画像，这是首次对话）'
  const parts = []
  if (profile.nickname) parts.push(`昵称：${profile.nickname}`)
  if (profile.personality)
    parts.push(`性格：${profile.personality === 'I' ? '内向型(I人)' : '外向型(E人)'}`)
  if (profile.tags && profile.tags.length)
    parts.push(`自我描述：${profile.tags.join('、')}`)
  if (profile.known_topics && profile.known_topics.length)
    parts.push(`已知关注话题：${profile.known_topics.join('、')}`)
  if (profile.last_emotion) parts.push(`上次主要情绪：${profile.last_emotion}`)
  if (profile.detected_scenario) parts.push(`上次场景：${profile.detected_scenario}`)
  if (profile.interaction_count)
    parts.push(`已对话次数：${profile.interaction_count}`)
  // 情绪时间线（最近3条，帮助 AI 看到趋势）
  if (profile.emotion_history && profile.emotion_history.length) {
    const recent = profile.emotion_history.slice(-3)
    const timeline = recent
      .map((e) => `${e.emotion}${e.reason ? `（${e.reason}）` : ''}`)
      .join(' → ')
    parts.push(`近期情绪变化：${timeline}`)
  }
  // 已识别的行为模式
  if (profile.pattern_hints && profile.pattern_hints.length) {
    parts.push(`观察到的行为模式：${profile.pattern_hints.join('；')}`)
  }
  if (profile.profile_insights && profile.profile_insights.length)
    parts.push(`累积洞察：${profile.profile_insights.slice(-3).join('；')}`)
  return parts.length ? parts.join('\n') : '（暂无画像）'
}

/**
 * 生成回复 + mirror 面板 + profile_update（单次调用）
 * @param message 用户消息
 * @param profile 用户侧写（来自 user_profiles，用于注入 prompt 个性化）
 */
async function generateReply(message, profile) {
  const client = await getClient()
  const systemContent = CHAT_PROMPT.replace(
    '{PROFILE_PLACEHOLDER}',
    formatProfile(profile),
  )
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  // 兜底：保证 mirror 结构完整
  parsed.mirror = parsed.mirror || {}
  parsed.mirror.signals =
    parsed.mirror.signals && parsed.mirror.signals.length
      ? parsed.mirror.signals
      : ['想要倾诉']
  parsed.mirror.strategy = parsed.mirror.strategy || '陪伴性语言承接情绪'
  parsed.mirror.blindspots =
    parsed.mirror.blindspots && parsed.mirror.blindspots.length
      ? parsed.mirror.blindspots
      : ['可能忽略了你的实际处境']
  parsed.mirror.limitation = parsed.mirror.limitation || FALLBACK_LIMITATION

  // 兜底：保证 profile_update 结构完整
  parsed.profile_update = parsed.profile_update || {}
  parsed.profile_update.detected_scenario =
    parsed.profile_update.detected_scenario || '其他'
  parsed.profile_update.new_topics = parsed.profile_update.new_topics || []
  parsed.profile_update.emotion_signal =
    parsed.profile_update.emotion_signal || '未明确'
  parsed.profile_update.emotion_reason =
    parsed.profile_update.emotion_reason || ''
  parsed.profile_update.insight = parsed.profile_update.insight || ''
  parsed.profile_update.pattern_hint =
    parsed.profile_update.pattern_hint || null

  return parsed
}

/** 生成三种风格的多版本回复（单次调用返回数组，避免三次请求超时） */
async function generateLabVersions(message) {
  const client = await getClient()
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: LAB_PROMPT },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  return parsed.versions || []
}

/** 生成会话总结（压缩聊天记录为精简摘要） */
async function generateSummary(chatText) {
  const client = await getClient()
  // 截断过长的聊天文本（保留最近 ~4000 字）
  const truncated = chatText.length > 4000
    ? '…（较早的对话已省略）…\n' + chatText.slice(-4000)
    : chatText
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SUMMARY_PROMPT },
      { role: 'user', content: truncated },
    ],
    temperature: 0.3, // 总结用较低温度保证稳定性
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  return {
    summary: parsed.summary || '一次温暖的对话。',
    analysis: parsed.analysis || '你似乎在努力看清自己的感受，也在寻找一个更适合自己的方向。',
    reflectionQuestion: parsed.reflection_question || '如果现在回头看，你最想先照顾好哪一种感受？',
  }
}

/**
 * 生成情绪分析（用于 EmotionTree 果实）
 * 返回：emotion_type + emotion_color + summary_300
 */
async function generateEmotionAnalysis(chatText) {
  const client = await getClient()
  // 截断过长的聊天文本（保留最近 ~4000 字）
  const truncated = chatText.length > 4000
    ? '…（较早的对话已省略）…\n' + chatText.slice(-4000)
    : chatText
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EMOTION_ANALYSIS_PROMPT },
      { role: 'user', content: truncated },
    ],
    temperature: 0.4, // 稍高一点，允许更多样化的情绪判断
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  // 兜底：保证结构完整
  const validEmotions = ['joy', 'warm', 'sad', 'anxious', 'confused', 'calm']
  parsed.emotion_type = validEmotions.includes(parsed.emotion_type) ? parsed.emotion_type : 'warm'
  parsed.emotion_color = parsed.emotion_color || '#FFE4D0'
  parsed.summary_300 = parsed.summary_300 || '一次值得记住的对话。'

  return {
    emotionType: parsed.emotion_type,
    emotionColor: parsed.emotion_color,
    summary300: parsed.summary_300,
  }
}

module.exports = { generateReply, generateLabVersions, generateSummary, generateEmotionAnalysis }
