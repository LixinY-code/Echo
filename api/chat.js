// POST /api/chat —— 发送消息，返回回复 + mirror 面板（CommonJS）
// 读用户侧写注入 prompt 个性化回复；对话后更新侧写（长期记忆）
const crypto = require('crypto')
const { generateReply } = require('../lib/deepseek')
const { ensureUser, saveMessage, getProfile, updateProfile } = require('../lib/store')

/**
 * 解析请求体（兼容 Verver Serverless Functions）
 * Vercel 通常会自动解析 JSON body，但某些情况下 req.body 可能为 undefined
 */
async function parseBody(req) {
  // 如果已经有 body 且是对象，直接返回
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  // 否则手动读取 stream 解析
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
      // 防止超大 payload（限制 1MB）
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(new Error('Invalid JSON in request body'))
      }
    })
    req.on('error', reject)
  })
}

module.exports = async (req, res) => {
  // 设置响应头（提前设置，防止出错时无法返回）
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ====== 步骤 1：解析请求体 ======
  let body
  try {
    body = await parseBody(req)
    console.log('[chat] 收到请求体：', JSON.stringify(body)?.slice(0, 200))
  } catch (e) {
    console.error('[chat] 解析请求体失败：', e)
    return res.status(400).json({ error: '无效的请求数据', detail: e.message })
  }

  const { message, sessionId } = body || {}
  const userId = req.headers['x-user-id'] || 'anonymous'
  const sid = sessionId || crypto.randomUUID()

  // 验证必填字段
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message 必填且为字符串' })
  }

  try {
    // ====== 步骤 2：确保用户存在 + 读取侧写 ======
    let uid, profile
    try {
      uid = await ensureUser(userId)
      console.log('[chat] 用户 ID：', uid)
    } catch (e) {
      console.error('[chat] ensureUser 失败：', e)
      // 如果 ensureUser 失败（可能是数据库问题），使用原始 userId 继续尝试
      uid = userId
    }

    try {
      profile = await getProfile(uid)
      console.log('[chat] 读取侧写成功：', profile ? `昵称=${profile.nickname || '无'}, 对话次数=${profile.interaction_count || 0}` : '无')
    } catch (e) {
      console.warn('[chat] getProfile 失败（使用空侧写继续）：', e?.message || e)
      profile = null
    }

    // ====== 步骤 3：检查环境变量 ======
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('[chat] ❌ DEEPSEEK_API_KEY 未配置！')
      return res.status(500).json({
        error: '服务配置错误：DeepSeek API Key 未设置',
        detail: '请在 Vercel 项目设置中添加 DEEPSEEK_API_KEY 环境变量',
      })
    }

    // ====== 步骤 4：调用 DeepSeek 生成回复 ======
    let reply, mirror, profile_update
    try {
      console.log('[chat] 正在调用 DeepSeek...')
      const result = await generateReply(message, profile)
      reply = result.reply
      mirror = result.mirror
      profile_update = result.profile_update
      console.log('[chat] ✅ DeepSeek 回复成功，长度：', reply?.length || 0)
    } catch (e) {
      console.error('[chat] ❌ DeepSeek 调用失败：', e)

      // 区分不同类型的错误
      const errorMsg = e?.message || String(e)
      if (errorMsg.includes('API key') || errorMsg.includes('401') || errorMsg.includes('403')) {
        return res.status(502).json({
          error: 'AI 服务认证失败',
          detail: 'DeepSeek API Key 无效或已过期',
        })
      }
      if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNRESET')) {
        return res.status(504).json({
          error: 'AI 服务超时',
          detail: 'DeepSeek API 响应超时，请稍后重试',
        })
      }
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        return res.status(429).json({
          error: '请求过于频繁',
          detail: 'DeepSeek API 调用频率超限，请稍后重试',
        })
      }

      // 其他未知错误
      return res.status(502).json({
        error: 'AI 服务异常',
        detail: errorMsg,
      })
    }

    // ====== 步骤 5：构建画像上下文 ======
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

    // ====== 步骤 6：存储消息 + 更新侧写（失败不影响回复返回） ======
    try {
      await Promise.all([
        saveMessage(uid, sid, 'user', message),
        saveMessage(uid, sid, 'ai', reply, mirror),
        updateProfile(uid, profile_update),
      ])
      console.log('[chat] ✅ 消息存储成功')
    } catch (e) {
      console.warn('[chat] ⚠️ 存储/侧写更新失败（不影响回复）：', e?.message || e)
    }

    // 返回成功响应
    console.log('[chat] ✅ 响应成功')
    return res.json({ reply, mirror: { ...mirror, profileContext }, sessionId: sid })

  } catch (e) {
    // 兜底错误处理（不应该到达这里）
    console.error('[chat] 🔥 未预期的错误：', e)
    return res.status(500).json({
      error: '服务器内部错误',
      detail: process.env.NODE_ENV === 'development' ? String(e) : '请联系管理员',
    })
  }
}
