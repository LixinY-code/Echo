// POST /api/onboarding —— 保存新用户引导问卷结果（CommonJS）
const { saveOnboarding, ensureUser } = require('../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = req.headers['x-user-id'] || 'anonymous'
    const data = req.body || {}
    const uid = await ensureUser(userId)
    await saveOnboarding(uid, data)
    res.json({ success: true })
  } catch (e) {
    console.error('[onboarding] 错误：', e)
    res.status(500).json({ error: '保存问卷失败', detail: String(e) })
  }
}
