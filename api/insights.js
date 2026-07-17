// GET /api/insights —— 个人洞察周报（CommonJS）
const { getInsightsData } = require('../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = req.headers['x-user-id'] || 'anonymous'
    const data = await getInsightsData(userId)
    res.json(data)
  } catch (e) {
    console.error('[insights] 错误：', e)
    res.status(500).json({ error: '获取洞察失败', detail: String(e) })
  }
}
