// POST /api/sessions —— 新建会话
// GET /api/sessions —— 获取会话列表
// GET /api/sessions/:id —— 获取会话消息
// PUT /api/sessions/:id/title —— 更新标题
// DELETE /api/sessions/:id —— 删除会话
// POST /api/sessions/:id/summary —— 生成会话总结
// POST /api/sessions/:id/emotion —— 情绪分析（EmotionTree 果实）
// GET /api/emotion-fruits —— 获取用户所有情绪果实
const { ensureUser, createSession, getSessions, getSessionMessages, updateSessionTitle, updateSessionSummary, updateSessionEmotion, getEmotionFruits, deleteSession } = require('../lib/store')
const { generateSummary, generateEmotionAnalysis } = require('../lib/deepseek')

/**
 * 解析请求体（兼容 Verver Serverless Functions）
 */
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(new Error('Invalid JSON in request body'))
      }
    })
    req.on('error', reject)
  })
}

module.exports = async (req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json')

  const userId = req.headers['x-user-id'] || 'anonymous'

  try {
    // ====== 路由分发 ======
    const { method } = req
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const pathname = url.pathname.replace(/^\/api\/sessions\/?/, '')

    // ====== 特殊路由：/api/emotion-fruits （不在 /api/sessions 前缀下） ======
    if (req.url?.includes('/api/emotion-fruits') && method === 'GET') {
      const uid = await ensureUser(userId).catch(() => userId)
      const fruits = await getEmotionFruits(uid)
      return res.json({ fruits })
    }

    // POST /api/sessions → 新建
    if (method === 'POST' && (pathname === '' || pathname === '/')) {
      const uid = await ensureUser(userId).catch(() => userId)
      let body
      try {
        body = await parseBody(req)
      } catch (e) {
        return res.status(400).json({ error: '无效的请求数据' })
      }
      const { title } = body || {}
      const session = await createSession(uid, title)
      return res.json(session)
    }

    // GET /api/sessions → 列表
    if (method === 'GET' && (pathname === '' || pathname === '/')) {
      const uid = await ensureUser(userId).catch(() => userId)
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
      const uid = await ensureUser(userId).catch(() => userId)
      const messages = await getSessionMessages(uid, sessionId)
      if (messages === null) {
        return res.status(404).json({ error: '会话不存在' })
      }
      return res.json({ sessionId, messages })
    }

    // PUT /api/sessions/:id/title → 更新标题
    if (method === 'PUT' && rest === '/title') {
      let body
      try {
        body = await parseBody(req)
      } catch (e) {
        return res.status(400).json({ error: '无效的请求数据' })
      }
      const { title } = body || {}
      if (!title) return res.status(400).json({ error: 'title 必填' })
      await updateSessionTitle(sessionId, title)
      return res.json({ success: true })
    }

    // DELETE /api/sessions/:id → 删除
    if (method === 'DELETE' && rest === '') {
      const uid = await ensureUser(userId).catch(() => userId)
      await deleteSession(uid, sessionId)
      return res.json({ success: true })
    }

    // POST /api/sessions/:id/summary → AI 总结
    if (method === 'POST' && rest === '/summary') {
      const uid = await ensureUser(userId).catch(() => userId)

      // 检查环境变量
      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({
          error: '服务配置错误：DeepSeek API Key 未设置',
          summary: null,
          analysis: null,
          reflectionQuestion: null,
          summarized: false,
        })
      }

      const messages = await getSessionMessages(uid, sessionId)
      if (!messages || messages.length < 2) {
        return res.json({
          summary: '对话太短，暂无总结。',
          analysis: '',
          reflectionQuestion: '',
          summarized: false,
        })
      }
      // 取用户消息 + AI 回复的文本
      const chatText = messages
        .filter((m) => m.text)
        .map((m) => `${m.role === 'user' ? '用户' : 'Echo'}：${m.text}`)
        .join('\n')
      try {
        const summaryData = await generateSummary(chatText)
        await updateSessionSummary(sessionId, summaryData)
        return res.json({ ...summaryData, summarized: true })
      } catch (e) {
        console.error('[sessions/summary] DeepSeek 失败：', e)
        return res.json({
          summary: '总结生成失败，请稍后重试。',
          analysis: '',
          reflectionQuestion: '',
          summarized: false,
          error: e?.message || String(e),
        })
      }
    }

    // POST /api/sessions/:id/emotion → 情绪分析（EmotionTree 果实）
    if (method === 'POST' && rest === '/emotion') {
      const uid = await ensureUser(userId).catch(() => userId)

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({
          error: '服务配置错误：DeepSeek API Key 未设置',
          emotionType: null,
          analyzed: false,
        })
      }

      const messages = await getSessionMessages(uid, sessionId)
      if (!messages || messages.length < 2) {
        return res.json({
          emotionType: 'warm',
          emotionColor: '#FFE4D0',
          summary300: '对话太短，还没结出果实呢。',
          analyzed: false,
        })
      }

      const chatText = messages
        .filter((m) => m.text)
        .map((m) => `${m.role === 'user' ? '用户' : 'Echo'}：${m.text}`)
        .join('\n')

      try {
        const emotionData = await generateEmotionAnalysis(chatText)
        // 存入 sessions 表
        await updateSessionEmotion(sessionId, emotionData)
        return res.json({ ...emotionData, analyzed: true })
      } catch (e) {
        console.error('[sessions/emotion] 情绪分析失败：', e)
        return res.json({
          emotionType: 'warm',
          emotionColor: '#FFE4D0',
          summary300: '情绪分析失败，但这颗果实依然温暖。',
          analyzed: false,
          error: e?.message || String(e),
        })
      }
    }

    return res.status(404).json({ error: '未找到路由' })
  } catch (e) {
    console.error('[sessions] 错误：', e)
    res.status(500).json({ error: '操作失败', detail: e?.message || String(e) })
  }
}
