// GET /api/profile —— 读取用户侧写（引导问卷结果，供个性化）（CommonJS）
const { getProfile, ensureUser } = require('../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = req.headers['x-user-id'] || 'anonymous'
    const uid = await ensureUser(userId)
    const profile = await getProfile(uid)
    res.json(profile || { tags: [] })
  } catch (e) {
    console.error('[profile] 错误：', e)
    res.status(500).json({ error: '读取侧写失败', detail: String(e) })
  }
}
