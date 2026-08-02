// POST /api/blindspot/grow —— 成长触发
// body: { type: 'view'|'journal'|'lab', text?, content? }
//  - view:    再次查看某盲点（text 为盲点原文）
//  - journal: 日记写到相关内容（content 为日记正文）
//  - lab:     完成一次 Conversation Lab 换框模式
// 返回 { newlyMatured } —— 本次新成熟的植物（用于前端彩蛋提示）
const { ensureUser, growBlindspots } = require('../../lib/store')

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
    const { type, text, content } = body || {}
    if (!['view', 'journal', 'lab'].includes(type)) {
      return res.status(400).json({ error: 'type 必须是 view | journal | lab' })
    }

    const uid = await ensureUser(userId).catch(() => userId)
    const result = await growBlindspots(uid, type, { text, content })
    return res.json(result)
  } catch (e) {
    console.error('[blindspot/grow] 错误：', e)
    return res.status(500).json({ error: '成长触发失败', detail: String(e) })
  }
}
