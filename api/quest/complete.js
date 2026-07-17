// POST /api/quest/complete —— 完成现实任务（CommonJS）
const crypto = require('crypto')
const { completeQuest, ensureUser } = require('../../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = req.headers['x-user-id'] || 'anonymous'
    const { questId } = req.body || {}
    const uid = await ensureUser(userId)
    await completeQuest(uid, questId || crypto.randomUUID())
    res.json({ success: true })
  } catch (e) {
    console.error('[quest] 错误：', e)
    res.status(500).json({ error: '记录任务失败', detail: String(e) })
  }
}
