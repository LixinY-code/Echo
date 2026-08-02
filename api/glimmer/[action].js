// /api/glimmer/[action] —— 微光任务合并函数（Vercel Hobby 12 函数上限对策）
// 一个动态段函数覆盖 3 条路由（前端 URL 不变）：
//   GET  /api/glimmer/today    → 今日任务（无则生成）+ 拼图进度
//   POST /api/glimmer/complete → 完成任务 + 彩蛋日记
//   GET  /api/glimmer/puzzle   → 拼图进度
const { ensureUser, getTodayGlimmers, insertGlimmers, getGlimmerCompletedCount, getRecentEmotionSignals, completeGlimmerById, createJournal } = require('../../lib/store')
const { shanghaiNow, pickDailyQuests } = require('../../lib/glimmer')

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch (e) { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function puzzleOf(totalCompleted) {
  return {
    totalCompleted,
    pieces: Math.floor(totalCompleted / 7),
    progressToNext: totalCompleted % 7,
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const userId = req.headers['x-user-id'] || 'anonymous'
  // 解析 action：URL 最后一段（today | complete | puzzle）
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const action = url.pathname.replace(/^\/api\/glimmer\/?/, '').replace(/\/$/, '')

  try {
    // ===== GET /api/glimmer/today =====
    if (req.method === 'GET' && action === 'today') {
      const uid = await ensureUser(userId).catch(() => userId)
      const { date, hour } = shanghaiNow()

      let quests = await getTodayGlimmers(uid, date)
      if (quests.length === 0) {
        const emotions = await getRecentEmotionSignals(uid)
        const picked = pickDailyQuests(uid, date, hour, emotions)
        await insertGlimmers(uid, date, picked)
        quests = await getTodayGlimmers(uid, date)
      }

      const totalCompleted = await getGlimmerCompletedCount(uid)
      return res.json({ quests, puzzle: puzzleOf(totalCompleted) })
    }

    // ===== POST /api/glimmer/complete =====
    if (req.method === 'POST' && action === 'complete') {
      const body = await parseBody(req)
      const { id } = body || {}
      if (!id) return res.status(400).json({ error: 'id 必填' })

      const uid = await ensureUser(userId)
      const quest = await completeGlimmerById(uid, id)

      // 日记彩蛋记录（私密，不送 AI）
      const content = `✨ 微光彩蛋\n\n今天完成了一个小实验：「${quest.text}」\n\n（这条记录来自微光任务，只有你和夜晚知道。）`
      await createJournal(uid, content, '希望').catch((e) => {
        console.warn('[glimmer/complete] 彩蛋日记写入失败：', e.message)
      })

      const totalCompleted = await getGlimmerCompletedCount(uid)
      return res.json({
        success: true,
        puzzle: puzzleOf(totalCompleted),
        newPiece: totalCompleted % 7 === 0,
      })
    }

    // ===== GET /api/glimmer/puzzle =====
    if (req.method === 'GET' && action === 'puzzle') {
      const uid = await ensureUser(userId).catch(() => userId)
      const totalCompleted = await getGlimmerCompletedCount(uid)
      return res.json(puzzleOf(totalCompleted))
    }

    return res.status(404).json({ error: '未知路由', action })
  } catch (e) {
    console.error(`[glimmer/${action}] 错误：`, e)
    return res.status(500).json({ error: '微光任务服务异常', detail: String(e) })
  }
}
