// DELETE /api/journal/:id —— 删除日记（限定本人）（CommonJS）
const { deleteJournal } = require('../../lib/store')

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = req.headers['x-user-id'] || 'anonymous'
    const { id } = req.query || {}
    await deleteJournal(userId, id)
    res.json({ success: true })
  } catch (e) {
    console.error('[journal DELETE] 错误：', e)
    res.status(500).json({ error: '删除日记失败', detail: String(e) })
  }
}
