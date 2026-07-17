// DeepSeek 调用封装（CommonJS）
// DeepSeek API 与 OpenAI 兼容，复用 openai SDK，仅改 baseURL。
// 用 dynamic import 加载 openai（兼容 ESM/CJS）。API Key 仅服务端。

const { CHAT_PROMPT, LAB_PROMPT } = require('./prompts')

const FALLBACK_LIMITATION =
  '这是一个语言模型根据模式生成的回应，并非真实情感体验。'

let _client = null

async function getClient() {
  if (_client) return _client
  const { default: OpenAI } = await import('openai')
  _client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  })
  return _client
}

/** 生成回复 + mirror 面板数据（单次调用，省 token、防超时） */
async function generateReply(message) {
  const client = await getClient()
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CHAT_PROMPT },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  // 兜底：保证 mirror 结构完整
  parsed.mirror = parsed.mirror || {}
  parsed.mirror.signals =
    parsed.mirror.signals && parsed.mirror.signals.length
      ? parsed.mirror.signals
      : ['想要倾诉']
  parsed.mirror.strategy = parsed.mirror.strategy || '陪伴性语言承接情绪'
  parsed.mirror.blindspots =
    parsed.mirror.blindspots && parsed.mirror.blindspots.length
      ? parsed.mirror.blindspots
      : ['可能忽略了你的实际处境']
  parsed.mirror.limitation = parsed.mirror.limitation || FALLBACK_LIMITATION

  return parsed
}

/** 生成三种风格的多版本回复（单次调用返回数组，避免三次请求超时） */
async function generateLabVersions(message) {
  const client = await getClient()
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: LAB_PROMPT },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)
  return parsed.versions || []
}

module.exports = { generateReply, generateLabVersions }
