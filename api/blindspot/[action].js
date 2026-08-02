// /api/blindspot/[action] —— 盲点花园合并函数（Vercel Hobby 12 函数上限对策）
// 一个动态段函数覆盖 3 条路由（前端 URL 不变）：
//   POST /api/blindspot/plant  → 种下盲点（user+text 去重）
//   GET  /api/blindspot/garden → 获取花园
//   POST /api/blindspot/grow   → 成长触发（view/journal/lab）
const { ensureUser, plantBlindspotSeed, getBlindspotSeeds, growBlindspots } = require('../../lib/store')

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

  const userId = req.headers['x-user-id'] || 'anonymous'
  // 解析 action：URL 最后一段（plant | garden | grow）
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const action = url.pathname.replace(/^\/api\/blindspot\/?/, '').replace(/\/$/, '')

  try {
    // ===== POST /api/blindspot/plant =====
    if (req.method === 'POST' && action === 'plant') {
      const body = await parseBody(req)
      const { text, sessionId } = body || {}
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text 必填' })
      }
      const uid = await ensureUser(userId)
      const result = await plantBlindspotSeed(uid, text.trim(), sessionId)
      return res.json(result)
    }

    // ===== GET /api/blindspot/garden =====
    if (req.method === 'GET' && action === 'garden') {
      const uid = await ensureUser(userId).catch(() => userId)
      const seeds = await getBlindspotSeeds(uid)
      return res.json({ seeds })
    }

    // ===== POST /api/blindspot/grow =====
    if (req.method === 'POST' && action === 'grow') {
      const body = await parseBody(req)
      const { type, text, content } = body || {}
      if (!['view', 'journal', 'lab'].includes(type)) {
        return res.status(400).json({ error: 'type 必须是 view | journal | lab' })
      }
      const uid = await ensureUser(userId).catch(() => userId)
      const result = await growBlindspots(uid, type, { text, content })
      return res.json(result)
    }

    return res.status(404).json({ error: '未知路由', action })
  } catch (e) {
    console.error(`[blindspot/${action}] 错误：`, e)
    return res.status(500).json({ error: '盲点花园服务异常', detail: String(e) })
  }
}
