// GET /api/glimmer/today —— 获取今日微光任务（不存在则生成）
// 每天 1-3 个，基于近期情绪 + 当前时段（Asia/Shanghai）
// 午夜自动更换：date 字段为上海时区日期，过期任务自然不再返回
const { ensureUser, getTodayGlimmers, insertGlimmers, getGlimmerCompletedCount, getRecentEmotionSignals } = require('../../lib/store')
const { shanghaiNow, pickDailyQuests } = require('../../lib/glimmer')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
    const uid = await ensureUser(userId).catch(() => userId)
    const { date, hour } = shanghaiNow()

    // 今日任务已生成则直接返回
    let quests = await getTodayGlimmers(uid, date)

    if (quests.length === 0) {
      // 基于近期情绪 + 时段生成
      const emotions = await getRecentEmotionSignals(uid)
      const picked = pickDailyQuests(uid, date, hour, emotions)
      await insertGlimmers(uid, date, picked)
      quests = await getTodayGlimmers(uid, date)
    }

    // 拼图进度
    const totalCompleted = await getGlimmerCompletedCount(uid)

    return res.json({
      quests,
      puzzle: {
        totalCompleted,
        pieces: Math.floor(totalCompleted / 7),
        progressToNext: totalCompleted % 7,
      },
    })
  } catch (e) {
    console.error('[glimmer/today] 错误：', e)
    return res.status(500).json({ error: '获取微光任务失败', detail: String(e) })
  }
}
