import type { VercelRequest, VercelResponse } from '@vercel/node'
import { completeQuest, ensureUser } from '../lib/store'

/** POST /api/quest/complete —— 完成现实任务 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = (req.headers['x-user-id'] as string) || 'anonymous'
    const { questId } = req.body as { questId: string }
    const uid = await ensureUser(userId)
    await completeQuest(uid, questId)
    res.json({ success: true })
  } catch (e) {
    console.error('[quest] 错误：', e)
    res.status(500).json({ error: '记录任务失败', detail: String(e) })
  }
}
