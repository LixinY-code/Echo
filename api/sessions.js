// POST /api/sessions —— 新建会话
// GET /api/sessions —— 获取会话列表
// GET /api/sessions/:id —— 获取会话消息
// PUT /api/sessions/:id/title —— 更新标题
// DELETE /api/sessions/:id —— 删除会话
// POST /api/sessions/:id/summary —— 生成会话总结
const { ensureUser, createSession, getSessions, getSessionMessages, updateSessionTitle, updateSessionSummary, deleteSession } = require('../lib/store')
const { generateSummary } = require('../lib/deepseek')

module.exports = async (req, res) => {
  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
    // ====== 路由分发 ======
    const { method } = req
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const pathname = url.pathname.replace(/^\/api\/sessions\/?/, '')

    // POST /api/sessions → 新建
    if (method === 'POST' && (pathname === '' || pathname === '/')) {
      const uid = await ensureUser(userId)
      const { title } = req.body || {}
      const session = await createSession(uid, title)
      return res.json(session)
    }

    // GET /api/sessions → 列表
    if (method === 'GET' && (pathname === '' || pathname === '/')) {
      const uid = await ensureUser(userId)
      const list = await getSessions(uid)
      return res.json({ sessions: list })
    }

    // 解析 :id 段
    const idPart = pathname.match(/^([^/?]+)(.*)/)
    if (!idPart) {
      return res.status(400).json({ error: '无效路径' })
    }
    const sessionId = idPart[1]
    const rest = idPart[2] || ''

    // GET /api/sessions/:id → 会话消息
    if (method === 'GET' && rest === '') {
      const uid = await ensureUser(userId)
      const messages = await getSessionMessages(uid, sessionId)
      if (messages === null) {
        return res.status(404).json({ error: '会话不存在' })
      }
      return res.json({ sessionId, messages })
    }

    // PUT /api/sessions/:id/title → 更新标题
    if (method === 'PUT' && rest === '/title') {
      const { title } = req.body || {}
      if (!title) return res.status(400).json({ error: 'title 必填' })
      await updateSessionTitle(sessionId, title)
      return res.json({ success: true })
    }

    // DELETE /api/sessions/:id → 删除
    if (method === 'DELETE' && rest === '') {
      const uid = await ensureUser(userId)
      await deleteSession(uid, sessionId)
      return res.json({ success: true })
    }

    // POST /api/sessions/:id/summary → AI 总结
    if (method === 'POST' && rest === '/summary') {
      const uid = await ensureUser(userId)
      const messages = await getSessionMessages(uid, sessionId)
      if (!messages || messages.length < 2) {
        return res.json({ summary: '对话太短，暂无总结。', summarized: false })
      }
      // 取用户消息 + AI 回复的文本
      const chatText = messages
        .filter((m) => m.text)
        .map((m) => `${m.role === 'user' ? '用户' : 'Echo'}：${m.text}`)
        .join('\n')
      const summary = await generateSummary(chatText)
      await updateSessionSummary(sessionId, summary)
      return res.json({ summary, summarized: true })
    }

    return res.status(404).json({ error: '未找到路由' })
  } catch (e) {
    console.error('[sessions] 错误：', e)
    res.status(500).json({ error: '操作失败', detail: String(e) })
  }
}
