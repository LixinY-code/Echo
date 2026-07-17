// POST /api/chat —— 发送消息，返回回复 + mirror 面板（CommonJS）
const crypto = require('crypto')
const { generateReply } = require('../lib/deepseek')
const { ensureUser, saveMessage } = require('../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { message, sessionId } = req.body || {}
    const userId = req.headers['x-user-id'] || 'anonymous'
    const sid = sessionId || crypto.randomUUID()

    const { reply, mirror } = await generateReply(message)

    // 存消息（存储失败不影响回复返回）
    try {
      const uid = await ensureUser(userId)
      await Promise.all([
        saveMessage(uid, sid, 'user', message),
        saveMessage(uid, sid, 'ai', reply, mirror),
      ])
    } catch (e) {
      console.warn('[chat] 存储消息失败：', e)
    }

    res.json({ reply, mirror, sessionId: sid })
  } catch (e) {
    console.error('[chat] 错误：', e)
    res.status(500).json({ error: '生成回复失败', detail: String(e) })
  }
}
