// 数据访问层 / Supabase（CommonJS）
// 所有写操作失败时抛错由 api 层 catch；查询失败降级返回空。

const { getSupabase } = require('./supabase')

/** 确保用户存在（按 device_id upsert），返回 user_id */
async function ensureUser(deviceId) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('users')
    .upsert({ device_id: deviceId }, { onConflict: 'device_id' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** 保存一条消息（用户或 AI） */
async function saveMessage(userId, sessionId, role, content, mirror) {
  const supabase = await getSupabase()
  const { error } = await supabase.from('messages').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    mirror,
  })
  if (error) throw error
}

/** 在一轮回复落库后刷新会话元信息 */
async function touchSession(sessionId, messageDelta = 2) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('sessions')
    .select('message_count')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  if (!data) return
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      message_count: (data.message_count || 0) + messageDelta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (updateError) throw updateError
}

/** 新建日记 */
async function createJournal(userId, content, emotion) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: userId,
      content,
      emotion,
      preview: content.slice(0, 60) || '（空白的一页）',
    })
    .select('id, created_at, emotion, preview, content')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.created_at,
    emotion: data.emotion,
    preview: data.preview,
    content: data.content,
  }
}

/** 获取日记列表（倒序） */
async function getJournals(userId) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('journals')
    .select('id, created_at, emotion, preview, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.id,
    date: r.created_at,
    emotion: r.emotion,
    preview: r.preview,
    content: r.content,
  }))
}

/** 删除日记（限定本人） */
async function deleteJournal(userId, id) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/** 完成现实任务 */
async function completeQuest(userId, questId) {
  const supabase = await getSupabase()
  const { error } = await supabase.from('quests').insert({
    user_id: userId,
    quest_id: questId,
  })
  if (error) throw error
}

/** 聚合周报洞察 */
async function getInsightsData(userId) {
  const supabase = await getSupabase()
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [msgRes, journalRes, questRes] = await Promise.all([
    supabase
      .from('messages')
      .select('created_at, mirror')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo),
    supabase
      .from('journals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo),
  ])

  const messages = msgRes.data || []
  const journalCount = journalRes.count || 0
  const completedQuests = questRes.count || 0

  // 聚合情绪主题
  const signalCount = {}
  for (const m of messages) {
    for (const s of (m.mirror && m.mirror.signals) || []) {
      signalCount[s] = (signalCount[s] || 0) + 1
    }
  }
  const mainTheme =
    Object.entries(signalCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    '正在慢慢浮现'

  // 高峰时段
  const hourCount = {}
  for (const m of messages) {
    const h = new Date(m.created_at).getHours()
    hourCount[h] = (hourCount[h] || 0) + 1
  }
  const peakHourEntry = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]
  const peakHours = peakHourEntry ? `${peakHourEntry[0]}:00 时段` : '数据还不足'

  // 依赖迹象：深夜使用次数
  const lateNightMsgs = messages.filter((m) => {
    const h = new Date(m.created_at).getHours()
    return h >= 23 || h < 5
  }).length
  const dependencySign =
    lateNightMsgs > 5
      ? `本周有 ${lateNightMsgs} 次在深夜 23:00 后使用，留意一下自己的作息`
      : '使用节奏平稳，没有明显的依赖迹象'

  // 盲点次数：带 mirror 的消息数
  const blindspotCount = messages.filter((m) => m.mirror).length

  const reflection =
    mainTheme !== '正在慢慢浮现'
      ? `这一周，"${mainTheme}" 反复出现。也许可以试着允许它，而不是急着赶走它。`
      : '还在开始阶段，先和 AI 聊聊吧，一周后这里会有一封写给你的信。'

  return {
    mainTheme,
    peakHours,
    dependencySign,
    reflection,
    completedQuests,
    journalCount,
    blindspotCount,
  }
}

/** 读取用户画像（来自引导问卷 + 对话累积 + 聊天偏好） */
async function getProfile(userId) {
  const supabase = await getSupabase()
  let data, error
  try {
    const result = await supabase
      .from('user_profiles')
      .select(
        'nickname, personality, tags, onboarded, known_topics, last_emotion, detected_scenario, interaction_count, profile_insights, emotion_history, pattern_hints, chat_preferences, first_seen_at, last_active_at, total_sessions, favorite_time_range',
      )
      .eq('user_id', userId)
      .maybeSingle()
    data = result.data
    error = result.error
  } catch (e) {
    console.warn('[profile] 查询异常（可能是字段不存在）：', e.message)
    return null
  }
  if (error) {
    // 如果是"column does not exist"错误，说明 schema 还没更新，返回基础画像
    if (error.code === '42703' || error.message?.includes('does not exist')) {
      console.warn('[profile] 字段不存在，尝试基础查询')
      try {
        const base = await supabase
          .from('user_profiles')
          .select('nickname, personality, tags, onboarded')
          .eq('user_id', userId)
          .maybeSingle()
        if (!base.error && base.data) {
          return {
            nickname: base.data.nickname || undefined,
            personality: base.data.personality || undefined,
            tags: base.data.tags || [],
          }
        }
      } catch { /* ignore */ }
      return null
    }
    console.warn('[profile] 读取失败：', error)
    return null
  }
  if (!data) return null
  return {
    nickname: data.nickname || undefined,
    personality: data.personality || undefined,
    tags: data.tags || [],
    known_topics: data.known_topics || [],
    last_emotion: data.last_emotion || undefined,
    detected_scenario: data.detected_scenario || undefined,
    interaction_count: data.interaction_count || 0,
    profile_insights: data.profile_insights || [],
    emotion_history: data.emotion_history || [],
    pattern_hints: data.pattern_hints || [],
    chat_preferences: data.chat_preferences || null,
    first_seen_at: data.first_seen_at || null,
    last_active_at: data.last_active_at || null,
    total_sessions: data.total_sessions || 0,
    favorite_time_range: data.favorite_time_range || null,
  }
}

/** 保存引导问卷结果（upsert user_profiles） */
async function saveOnboarding(userId, data) {
  const supabase = await getSupabase()
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      nickname: data.nickname || null,
      personality: data.personality || null,
      tags: data.tags || [],
      onboarded: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

/**
 * 每次对话后更新用户画像（merge 增量）
 * 容错处理：如果新字段不存在，只更新基础字段
 */
async function updateProfile(userId, update) {
  const supabase = await getSupabase()
  // 先读现有画像（容错：如果表不存在返回空对象）
  let existing
  try {
    const result = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    existing = result.data || {}
  } catch (e) {
    console.warn('[profile] 读取现有画像失败，使用空对象：', e.message)
    existing = {}
  }
  const cur = existing || {}

  // merge：话题去重累积（最多 20 条），洞察累积（最多 10 条）
  const knownTopics = Array.from(
    new Set([...(cur.known_topics || []), ...(update.new_topics || [])]),
  ).slice(-20)
  const profileInsights = [
    ...(cur.profile_insights || []),
    update.insight,
  ]
    .filter(Boolean)
    .slice(-10)

  // 情绪历史：追加本次情绪+原因（最近 15 条）
  const emotionHistory = [
    ...(cur.emotion_history || []),
  ]
  if (update.emotion_signal) {
    emotionHistory.push({
      emotion: update.emotion_signal,
      reason: update.emotion_reason || '',
      date: new Date().toISOString(),
    })
  }
  const trimmedHistory = emotionHistory.slice(-15)

  // 行为模式：去重累积（最多 8 条）
  const patternHints = Array.from(
    new Set([...(cur.pattern_hints || []), ...(update.pattern_hint ? [update.pattern_hint] : [])]),
  ).slice(-8)

  // 推断活跃时段（用于 favorite_time_range）
  const now = new Date()
  const hour = now.getHours()
  const currentRange = cur.favorite_time_range || { morning: 0, afternoon: 0, evening: 0, night: 0 }
  if (hour >= 6 && hour < 12) currentRange.morning++
  else if (hour >= 12 && hour < 18) currentRange.afternoon++
  else if (hour >= 18 && hour < 23) currentRange.evening++
  else currentRange.night++

  // 构建更新对象（分步尝试：先尝试完整字段，失败则回退到基础字段）
  const fullUpdate = {
    user_id: userId,
    nickname: cur.nickname,
    personality: cur.personality,
    tags: cur.tags || [],
    onboarded: cur.onboarded !== false,
    known_topics: knownTopics,
    last_emotion: update.emotion_signal || cur.last_emotion,
    detected_scenario: update.detected_scenario || cur.detected_scenario,
    interaction_count: (cur.interaction_count || 0) + 1,
    profile_insights: profileInsights,
    emotion_history: trimmedHistory,
    pattern_hints: patternHints,
    chat_preferences: cur.chat_preferences || { reply_style: 'balanced', length_preference: 'medium' },
    first_seen_at: cur.first_seen_at || now.toISOString(),
    last_active_at: now.toISOString(),
    total_sessions: (cur.total_sessions || 0) + (update.is_new_session ? 1 : 0),
    favorite_time_range: currentRange,
    updated_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase.from('user_profiles').upsert(fullUpdate, { onConflict: 'user_id' })
    if (error) throw error
  } catch (e) {
    // 如果是"column does not exist"错误，说明 schema 还没更新，回退到基础字段
    if (e.code === '42703' || e.message?.includes('does not exist')) {
      console.warn('[profile] 新字段不存在，回退到基础字段更新')
      const baseUpdate = {
        user_id: userId,
        nickname: cur.nickname,
        personality: cur.personality,
        tags: cur.tags || [],
        onboarded: true,
        known_topics: knownTopics,
        last_emotion: update.emotion_signal || cur.last_emotion,
        detected_scenario: update.detected_scenario || cur.detected_scenario,
        interaction_count: (cur.interaction_count || 0) + 1,
        profile_insights: profileInsights,
        updated_at: new Date().toISOString(),
      }
      const { error: err2 } = await supabase.from('user_profiles').upsert(baseUpdate, { onConflict: 'user_id' })
      if (err2) throw err2
    } else {
      throw e
    }
  }
}

/** 更新用户聊天偏好 */
async function updateChatPreferences(userId, prefs) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from('user_profiles')
    .update({ chat_preferences: prefs, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}

/* ============================================================
 * 会话（Session）管理
 * 每次新建聊天 = 一个 session，消息按 session_id 归档
 * 支持历史会话列表、会话切换、自动总结
 * ============================================================ */

/** 创建新会话 */
async function createSession(userId, title) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title: title || '新的对话',
      })
      .select('id, title, created_at, message_count, summary')
      .single()
    if (error) throw error
    return {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      messageCount: data.message_count || 0,
      summary: data.summary,
    }
  } catch (e) {
    // 如果 sessions 表不存在
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，生成本地 session ID')
      const crypto = require('crypto')
      return {
        id: crypto.randomUUID(),
        title: title || '新的对话',
        createdAt: new Date().toISOString(),
        messageCount: 0,
        summary: null,
        _local: true, // 标记为本地生成的（不持久化）
      }
    }
    throw e
  }
}

/** 获取用户所有会话列表（倒序，最近在前） */
async function getSessions(userId) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, created_at, message_count, summary, analysis, reflection_question, emotion_type, emotion_color, full_summary, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      messageCount: s.message_count || 0,
      summary: s.summary,
      analysis: s.analysis,
      reflectionQuestion: s.reflection_question,
      emotionType: s.emotion_type,
      emotionColor: s.emotion_color,
      fullSummary: s.full_summary,
    }))
  } catch (e) {
    if (e.code === '42P01') {
      console.warn('[sessions] 表不存在，返回空列表')
      return []
    }
    if (e.code === '42703' || e.message?.includes('column')) {
      console.warn('[sessions] 回顾字段尚未迁移，降级读取基础会话列表')
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, created_at, message_count, summary, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data || []).map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messageCount: s.message_count || 0,
        summary: s.summary,
      }))
    }
    throw e
  }
}

/** 获取单个会话的所有消息 */
async function getSessionMessages(userId, sessionId) {
  const supabase = await getSupabase()
  try {
    // 验证会话归属
    const { data: sess } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!sess) return null

    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, mirror, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map((m) => ({
      id: m.id,
      role: m.role === 'assistant' ? 'ai' : m.role,
      text: m.content,
      mirror: m.mirror,
      timestamp: new Date(m.created_at).getTime(),
    }))
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，返回 null')
      return null
    }
    throw e
  }
}

/** 更新会话标题（取第一条用户消息前 N 字） */
async function updateSessionTitle(sessionId, title) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，跳过标题更新')
      return
    }
    throw e
  }
}

/** 更新会话总结 */
async function updateSessionSummary(sessionId, summaryData) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        summary: summaryData.summary,
        analysis: summaryData.analysis,
        reflection_question: summaryData.reflectionQuestion,
        updated_at: new Date().toISOString(),
        summarized_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
    if (error) throw error
  } catch (e) {
    if (e.code === '42P01') {
      console.warn('[sessions] 表不存在，跳过总结更新')
      return
    }
    if (e.code === '42703' || e.message?.includes('column')) {
      console.warn('[sessions] 回顾字段尚未迁移，降级保存基础总结')
      const { error } = await supabase
        .from('sessions')
        .update({
          summary: summaryData.summary,
          updated_at: new Date().toISOString(),
          summarized_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
      if (error) throw error
      return
    }
    throw e
  }
}

/**
 * 更新会话的情绪分析结果（EmotionTree 果实数据）
 * @param sessionId - 会话 ID
 * @param emotionData - { emotionType, emotionColor, summary300, title? }
 */
async function updateSessionEmotion(sessionId, emotionData) {
  const supabase = await getSupabase()
  try {
    const updateObj = {
      emotion_type: emotionData.emotionType,
      emotion_color: emotionData.emotionColor,
      full_summary: emotionData.summary300,
      updated_at: new Date().toISOString(),
    }
    // 如果传了 title，也一起更新
    if (emotionData.title) {
      updateObj.title = emotionData.title
    }
    const { error } = await supabase
      .from('sessions')
      .update(updateObj)
      .eq('id', sessionId)
    if (error) throw error
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，跳过情绪更新')
      return
    }
    // 如果是字段不存在的错误（schema 还没更新），降级为只更新基础字段
    if (e.code === '42703' || e.message?.includes('column') || e.message?.includes('does not exist')) {
      console.warn('[sessions] emotion 字段不存在，尝试基础更新')
      try {
        const { error: err2 } = await supabase
          .from('sessions')
          .update({
            summary: emotionData.summary300,
            title: emotionData.title,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
        if (err2) throw err2
      } catch { /* ignore */ }
      return
    }
    throw e
  }
}

/**
 * 获取用户所有带情绪数据的会话（用于 EmotionTree 渲染）
 * 返回数组：每项包含 id, title, emotion_type, emotion_color, full_summary, created_at 等
 */
async function getEmotionFruits(userId) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, emotion_type, emotion_color, full_summary, summary, message_count, created_at, updated_at')
      .eq('user_id', userId)
      .not('emotion_type', 'is', null)
      .order('created_at', { ascending: true }) // 按时间正序（先长的果子在下面）
    if (error) throw error
    return (data || []).map((s) => ({
      sessionId: s.id,
      title: s.title || '一次对话',
      emotionType: s.emotion_type || 'warm',
      emotionColor: s.emotion_color || '#FFE4D0',
      summary300: s.full_summary || s.summary || '',
      messageCount: s.message_count || 0,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，返回空果实列表')
      return []
    }
    // 字段不存在时返回空
    if (e.code === '42703') {
      console.warn('[sessions] emotion 字段不存在，返回空果实列表')
      return []
    }
    throw e
  }
}

/** 删除一个会话及其所有消息 */
async function deleteSession(userId, sessionId) {
  const supabase = await getSupabase()
  try {
    // 验证归属
    const { data: sess } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!sess) throw new Error('会话不存在或无权删除')

    // 并行删除消息和会话
    await Promise.all([
      supabase.from('messages').delete().eq('session_id', sessionId),
      supabase.from('sessions').delete().eq('id', sessionId),
    ])
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[sessions] 表不存在，跳过删除')
      return
    }
    throw e
  }
}

/* ============================================================
 * 微光任务（Glimmer Quests）
 * 轻量日常彩蛋任务：每天 1-3 个，午夜自动更换，无惩罚
 * ============================================================ */

/** 获取用户今日微光任务（dateStr 为上海时区 YYYY-MM-DD） */
async function getTodayGlimmers(userId, dateStr) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('glimmer_quests')
      .select('id, quest_key, text, emoji, completed, completed_at')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map((r) => ({
      id: r.id,
      questKey: r.quest_key,
      text: r.text,
      emoji: r.emoji || '✨',
      completed: !!r.completed,
    }))
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[glimmer] 表不存在，返回空列表')
      return []
    }
    throw e
  }
}

/** 插入今日微光任务（quest: {key,text,emoji}） */
async function insertGlimmers(userId, dateStr, quests) {
  const supabase = await getSupabase()
  const rows = quests.map((q) => ({
    user_id: userId,
    quest_key: q.key,
    text: q.text,
    emoji: q.emoji,
    date: dateStr,
  }))
  const { error } = await supabase.from('glimmer_quests').insert(rows)
  // 唯一索引冲突（并发重复生成）时忽略，由调用方重新读取
  if (error && error.code !== '23505') throw error
}

/** 完成一个微光任务（限定本人），返回该任务文本用于彩蛋日记 */
async function completeGlimmerById(userId, glimmerId) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('glimmer_quests')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', glimmerId)
    .eq('user_id', userId)
    .select('text, emoji')
    .single()
  if (error) throw error
  return data
}

/** 累计完成的微光任务数（用于拼图碎片：7 个 = 1 块） */
async function getGlimmerCompletedCount(userId) {
  const supabase = await getSupabase()
  try {
    const { count, error } = await supabase
      .from('glimmer_quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
    if (error) throw error
    return count || 0
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      return 0
    }
    throw e
  }
}

/** 近期情绪词（来自 user_profiles.emotion_history，最多取最近 10 条） */
async function getRecentEmotionSignals(userId) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('emotion_history')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    const history = (data && data.emotion_history) || []
    return history.slice(-10).map((h) => h && h.emotion).filter(Boolean)
  } catch (e) {
    console.warn('[glimmer] 读取近期情绪失败：', e.message)
    return []
  }
}

/* ============================================================
 * 盲点花园（Blindspot Garden）
 * 把 AI 的"可能盲点"种下，靠用户的反思行为（查看/日记/换框）
 * 让它发芽成熟，最终成为一株有名字的植物
 * ============================================================ */

const { extractTheme, pickPlantName, buildMessage, journalMatches, stageOf, MATURE_GROWTH } = require('./blindspot')

/** 上海时区今日日期串 */
function shanghaiDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

/** 行 → 前端种子对象 */
function mapSeed(r) {
  return {
    id: r.id,
    blindspotText: r.blindspot_text,
    theme: r.theme,
    plantName: r.plant_name || undefined,
    stage: r.stage,
    message: r.message || undefined,
    plantedAt: r.planted_at,
    maturedAt: r.matured_at || undefined,
  }
}

/**
 * 种下一个盲点（按 user_id + blindspot_text 去重）
 * 返回 { seed, already }
 */
async function plantBlindspotSeed(userId, text, sessionId) {
  const supabase = await getSupabase()

  // 已种过 → 直接返回已有种子
  const { data: existing } = await supabase
    .from('blindspot_seeds')
    .select('*')
    .eq('user_id', userId)
    .eq('blindspot_text', text)
    .maybeSingle()
  if (existing) return { seed: mapSeed(existing), already: true }

  // 取来源会话标题（用于成熟提示语）
  let sessionTitle = null
  if (sessionId) {
    try {
      const { data: sess } = await supabase
        .from('sessions')
        .select('title')
        .eq('id', sessionId)
        .maybeSingle()
      sessionTitle = sess?.title || null
    } catch { /* ignore */ }
  }

  const theme = extractTheme(text)
  const { data, error } = await supabase
    .from('blindspot_seeds')
    .insert({
      user_id: userId,
      blindspot_text: text,
      theme,
      source_session_id: sessionId || null,
      source_session_title: sessionTitle,
    })
    .select('*')
    .single()

  // 并发/重复插入冲突 → 返回已有
  if (error) {
    if (error.code === '23505') {
      const { data: dup } = await supabase
        .from('blindspot_seeds')
        .select('*')
        .eq('user_id', userId)
        .eq('blindspot_text', text)
        .maybeSingle()
      if (dup) return { seed: mapSeed(dup), already: true }
    }
    throw error
  }
  return { seed: mapSeed(data), already: false }
}

/** 获取花园所有种子（按种下时间正序） */
async function getBlindspotSeeds(userId) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from('blindspot_seeds')
      .select('*')
      .eq('user_id', userId)
      .order('planted_at', { ascending: true })
    if (error) throw error
    return (data || []).map(mapSeed)
  } catch (e) {
    if (e.code === '42P01' || e.message?.includes('does not exist')) {
      console.warn('[blindspot] 表不存在，返回空花园')
      return []
    }
    throw e
  }
}

/**
 * 成长触发
 * @param {'view'|'journal'|'lab'} type
 *   - view:    再次查看某盲点 → 仅该文本种子 +1（opts.text）
 *   - journal: 日记写到相关内容 → 关键词命中的种子 +1（opts.content）
 *   - lab:     完成换框模式 → 所有未成熟种子 +1
 * 每个种子每天同类触发只加成一次。
 * 返回 { newlyMatured: Seed[] }
 */
async function growBlindspots(userId, type, opts = {}) {
  const supabase = await getSupabase()
  const today = shanghaiDateStr()

  const { data: rows, error } = await supabase
    .from('blindspot_seeds')
    .select('*')
    .eq('user_id', userId)
    .neq('stage', 'mature')
  if (error) throw error
  if (!rows || rows.length === 0) return { newlyMatured: [] }

  // 筛选本次触发覆盖的种子
  let candidates = rows
  if (type === 'view') {
    candidates = rows.filter((r) => r.blindspot_text === opts.text)
  } else if (type === 'journal') {
    candidates = rows.filter((r) => journalMatches(r.blindspot_text, opts.content || ''))
  } // lab → 全部

  const newlyMatured = []
  for (const r of candidates) {
    const triggers = Array.isArray(r.triggers) ? r.triggers : []
    // 按日 + 类型去重
    if (triggers.some((t) => t && t.type === type && t.date === today)) continue

    const growth = (r.growth || 0) + 1
    const stage = stageOf(growth)
    const update = {
      growth,
      stage,
      triggers: [...triggers, { type, date: today }],
    }
    // 成熟：揭晓植物名 + 提示语
    if (growth >= MATURE_GROWTH && r.stage !== 'mature') {
      update.plant_name = r.plant_name || pickPlantName()
      update.message = buildMessage(r.theme, r.source_session_title)
      update.matured_at = new Date().toISOString()
    }
    const { data: updated, error: upErr } = await supabase
      .from('blindspot_seeds')
      .update(update)
      .eq('id', r.id)
      .select('*')
      .single()
    if (!upErr && updated && updated.stage === 'mature' && r.stage !== 'mature') {
      newlyMatured.push(mapSeed(updated))
    }
  }

  return { newlyMatured }
}

module.exports = {
  ensureUser,
  saveMessage,
  touchSession,
  createJournal,
  getJournals,
  deleteJournal,
  completeQuest,
  getInsightsData,
  getProfile,
  saveOnboarding,
  updateProfile,
  updateChatPreferences,
  // 会话管理
  createSession,
  getSessions,
  getSessionMessages,
  updateSessionTitle,
  updateSessionSummary,
  updateSessionEmotion,
  getEmotionFruits,
  deleteSession,
  // 微光任务
  getTodayGlimmers,
  insertGlimmers,
  completeGlimmerById,
  getGlimmerCompletedCount,
  getRecentEmotionSignals,
  // 盲点花园
  plantBlindspotSeed,
  getBlindspotSeeds,
  growBlindspots,
}
