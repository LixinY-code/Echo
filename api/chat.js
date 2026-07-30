// POST /api/chat —— 发送消息，返回回复 + mirror 面板（CommonJS）
// 读用户侧写注入 prompt 个性化回复；对话后更新侧写（长期记忆）
const crypto = require('crypto')
const { generateReply } = require('../lib/deepseek')
const { ensureUser, saveMessage, getProfile, updateProfile } = require('../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { message, sessionId } = req.body || {}
    const userId = req.headers['x-user-id'] || 'anonymous'
    const sid = sessionId || crypto.randomUUID()

    // 确保用户 + 读侧写（用于注入 prompt 个性化）
    const uid = await ensureUser(userId)
    const profile = await getProfile(uid).catch(() => null)

    // 生成回复（注入侧写）+ 拿到 profile_update
    const { reply, mirror, profile_update } = await generateReply(
      message,
      profile,
    )

    // 构建画像上下文（让前端 MirrorPanel 展示"我记得你…"）
    let profileContext = null
    if (profile && profile.interaction_count && profile.interaction_count > 0) {
      const count = profile.interaction_count + 1 // 含本次
      const parts = [`这是我们第 ${count} 次对话了`]
      if (profile.nickname) parts.push(`，${profile.nickname}`)
      if (profile.last_emotion) {
        parts.push(`。上次你说的时候带着${profile.last_emotion}的情绪`)
      }
      // 检测情绪是否重复出现
      const currentEmotion = profile_update?.emotion_signal
      if (
        currentEmotion &&
        profile.last_emotion &&
        currentEmotion === profile.last_emotion
      ) {
        parts.push(`，而这次我依然感受到了${currentEmotion}`)
      }
      // 如果有模式提示
      if (profile.pattern_hints && profile.pattern_hints.length > 0) {
        parts.push(`。我注意到你似乎${profile.pattern_hints[0]}`)
      }
      parts.push('。')
      profileContext = parts.join('')
    }

    // 存消息 + 更新侧写（失败不影响回复返回）
    try {
      await Promise.all([
        saveMessage(uid, sid, 'user', message),
        saveMessage(uid, sid, 'ai', reply, mirror),
        updateProfile(uid, profile_update),
      ])
    } catch (e) {
      console.warn('[chat] 存储/侧写更新失败：', e)
    }

    res.json({ reply, mirror: { ...mirror, profileContext }, sessionId: sid })
  } catch (e) {
    console.error('[chat] 错误：', e)
    res.status(500).json({ error: '生成回复失败', detail: String(e) })
  }
}
