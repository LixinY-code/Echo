/**
 * DeepSeek 调用封装
 * DeepSeek API 与 OpenAI 完全兼容，复用 openai SDK，仅改 baseURL。
 * API Key 仅在服务端（Vercel 环境变量），前端永远拿不到。
 */
import OpenAI from 'openai'
import { CHAT_PROMPT, LAB_PROMPT } from './prompts'
import type { MirrorData, LabVersion } from '../src/types'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

const FALLBACK_LIMITATION =
  '这是一个语言模型根据模式生成的回应，并非真实情感体验。'

export interface ChatResult {
  reply: string
  mirror: MirrorData
}

/** 生成回复 + mirror 面板数据（单次调用，省 token、防超时） */
export async function generateReply(message: string): Promise<ChatResult> {
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CHAT_PROMPT },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw) as ChatResult

  // 兜底：保证 mirror 结构完整
  parsed.mirror = parsed.mirror || ({} as MirrorData)
  parsed.mirror.signals = parsed.mirror.signals?.length ? parsed.mirror.signals : ['想要倾诉']
  parsed.mirror.strategy = parsed.mirror.strategy || '陪伴性语言承接情绪'
  parsed.mirror.blindspots = parsed.mirror.blindspots?.length ? parsed.mirror.blindspots : ['可能忽略了你的实际处境']
  parsed.mirror.limitation = parsed.mirror.limitation || FALLBACK_LIMITATION

  return parsed
}

/** 生成三种风格的多版本回复（单次调用返回数组，避免三次请求超时） */
export async function generateLabVersions(message: string): Promise<LabVersion[]> {
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: LAB_PROMPT },
      { role: 'user', content: message },
    ],
  })
  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw) as { versions: LabVersion[] }
  return parsed.versions || []
}
