// POST /api/glimmer/complete —— 完成一个微光任务
// 完成后自动在日记里添加一条彩蛋记录（✨ 微光彩蛋）
const { ensureUser, completeGlimmerById, getGlimmerCompletedCount, createJournal } = require('../../lib/store')

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

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
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
      puzzle: {
        totalCompleted,
        pieces: Math.floor(totalCompleted / 7),
        progressToNext: totalCompleted % 7,
      },
      newPiece: totalCompleted % 7 === 0, // 刚好集满 7 个 → 解锁新碎片
    })
  } catch (e) {
    console.error('[glimmer/complete] 错误：', e)
    return res.status(500).json({ error: '完成任务失败', detail: String(e) })
  }
}
