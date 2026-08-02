// GET /api/glimmer/puzzle —— 情绪拼图进度
// 每完成 7 个微光任务解锁一块碎片（共 9 块组成完整拼图）
const { ensureUser, getGlimmerCompletedCount } = require('../../lib/store')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
    const uid = await ensureUser(userId).catch(() => userId)
    const totalCompleted = await getGlimmerCompletedCount(uid)

    return res.json({
      totalCompleted,
      pieces: Math.floor(totalCompleted / 7),
      progressToNext: totalCompleted % 7,
    })
  } catch (e) {
    console.error('[glimmer/puzzle] 错误：', e)
    return res.status(500).json({ error: '获取拼图进度失败', detail: String(e) })
  }
}
