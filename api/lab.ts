import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateLabVersions } from '../lib/deepseek'

/** POST /api/lab —— 同一问题的三种风格回复 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { message } = req.body as { message: string }
    const versions = await generateLabVersions(message)
    res.json({ versions })
  } catch (e) {
    console.error('[lab] 错误：', e)
    res.status(500).json({ error: '生成多版本失败', detail: String(e) })
  }
}
