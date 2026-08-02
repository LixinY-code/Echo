// POST /api/blindspot/plant —— 种下一个盲点
// body: { text, sessionId? }
// 按 user_id + blindspot_text 去重；已种过返回 already: true
const { ensureUser, plantBlindspotSeed } = require('../../lib/store')

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
    const { text, sessionId } = body || {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text 必填' })
    }

    const uid = await ensureUser(userId)
    const result = await plantBlindspotSeed(uid, text.trim(), sessionId)
    return res.json(result)
  } catch (e) {
    console.error('[blindspot/plant] 错误：', e)
    return res.status(500).json({ error: '种下盲点失败', detail: String(e) })
  }
}
