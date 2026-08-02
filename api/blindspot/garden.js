// GET /api/blindspot/garden —— 获取盲点花园（所有种子，按种下时间正序）
const { ensureUser, getBlindspotSeeds } = require('../../lib/store')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
    const uid = await ensureUser(userId).catch(() => userId)
    const seeds = await getBlindspotSeeds(uid)
    return res.json({ seeds })
  } catch (e) {
    console.error('[blindspot/garden] 错误：', e)
    return res.status(500).json({ error: '获取花园失败', detail: String(e) })
  }
}
