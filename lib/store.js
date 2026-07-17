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
  await supabase.from('messages').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    mirror,
  })
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

/** 读取用户侧写（来自引导问卷） */
async function getProfile(userId) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('nickname, personality, tags, onboarded')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.warn('[profile] 读取失败：', error)
    return null
  }
  if (!data) return null
  return {
    nickname: data.nickname || undefined,
    personality: data.personality || undefined,
    tags: data.tags || [],
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

module.exports = {
  ensureUser,
  saveMessage,
  createJournal,
  getJournals,
  deleteJournal,
  completeQuest,
  getInsightsData,
  getProfile,
  saveOnboarding,
}
