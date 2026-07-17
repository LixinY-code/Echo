import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteJournal } from '../../lib/store'

/** DELETE /api/journal/:id —— 删除日记（限定本人） */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const userId = (req.headers['x-user-id'] as string) || 'anonymous'
    const { id } = req.query as { id: string }
    await deleteJournal(userId, id)
    res.json({ success: true })
  } catch (e) {
    console.error('[journal DELETE] 错误：', e)
    res.status(500).json({ error: '删除日记失败', detail: String(e) })
  }
}
