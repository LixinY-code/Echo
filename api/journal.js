// GET /api/journal 列表  ·  POST /api/journal 新建（CommonJS）
const { createJournal, getJournals, ensureUser } = require('../lib/store')

module.exports = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'anonymous'

  if (req.method === 'GET') {
    try {
      const list = await getJournals(userId)
      return res.json(list)
    } catch (e) {
      console.error('[journal GET] 错误：', e)
      return res.status(500).json({ error: '获取日记失败', detail: String(e) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, emotion } = req.body || {}
      const uid = await ensureUser(userId)
      const entry = await createJournal(uid, content, emotion)
      return res.json(entry)
    } catch (e) {
      console.error('[journal POST] 错误：', e)
      return res.status(500).json({ error: '保存日记失败', detail: String(e) })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
