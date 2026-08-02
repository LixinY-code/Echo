// ============================================================
// Blindspot Garden —— 盲点花园领域逻辑（CommonJS）
//
// 核心理念：AI 坦诚"我可能没看到的地方"，用户把盲点种下，
// 通过后续的反思行为（再次查看 / 写日记 / Conversation Lab 换框）
// 让它发芽、长大，最终成为一株有名字的植物。
//
// 成长规则（内部计数，UI 不展示任何数字）：
//  - growth 0      → seed（种子）
//  - growth 1-2    → sprout（发芽）
//  - growth >= 3   → mature（成熟，揭晓名字与提示语）
//  - 每个种子每天同类触发只加成 1 次（triggers jsonb 按日去重）
// ============================================================

/** 成长阈值 */
const MATURE_GROWTH = 3

/** 触发类型 */
const TRIGGER_TYPES = ['view', 'journal', 'lab']

/** 主题提取规则（从盲点原文提取命名前半段） */
const THEME_RULES = [
  [/支持|朋友|家人|身边|陪伴/, '被忽略的支持'],
  [/视角|角度|可能|另一种|别的/, '另一种可能'],
  [/尝试|方法|做过|已经/, '未问出口的路'],
  [/情绪|事实|感受|当作/, '情绪与事实之间'],
  [/身体|休息|睡眠|累|疲惫/, '身体的信号'],
  [/过去|曾经|经验|以前/, '旧经验的声音'],
  [/他人|别人|对方|处境/, '他人的处境'],
  [/时间|匆忙|着急|来不及/, '被催促的时间'],
]

/** 主题兜底池（规则未命中时随机取） */
const THEME_FALLBACKS = [
  '没被看见的一角',
  '轻声说话的部分',
  '被跳过的细节',
  '藏在话外的事',
]

/** 植物名池（成熟时随机揭晓） */
const PLANT_NAMES = [
  '铃兰', '薄荷', '含羞草', '蒲公英', '雏菊', '满天星',
  '迷迭香', '薰衣草', '风信子', '酢浆草', '鸢尾', '木槿',
  '雪滴花', '婆婆纳',
]

/** 从盲点原文提取主题 */
function extractTheme(text) {
  for (const [re, theme] of THEME_RULES) {
    if (re.test(text)) return theme
  }
  return THEME_FALLBACKS[Math.floor(Math.random() * THEME_FALLBACKS.length)]
}

/** 随机分配植物名 */
function pickPlantName() {
  return PLANT_NAMES[Math.floor(Math.random() * PLANT_NAMES.length)]
}

/**
 * 生成成熟提示语（模板化，温柔邀请而非要求）
 * @param {string} theme 主题
 * @param {string|null} sessionTitle 来源会话标题（可为空）
 */
function buildMessage(theme, sessionTitle) {
  if (sessionTitle && sessionTitle !== '新的对话') {
    return `上次聊「${sessionTitle.slice(0, 18)}」时，${theme}悄悄溜走了。现在，你愿意再回头看看它吗？`
  }
  return `${theme}曾经从你的话边悄悄溜过。现在，你愿意再回头看看它吗？`
}

/** 从盲点原文提取关键词（用于日记内容匹配） */
function extractKeywords(text) {
  // 连续中文串上的 2-3 字滑动窗口（保证 "支持"/"朋友" 这类词不被切开）
  const chars = (text.match(/[\u4e00-\u9fa5]+/g) || []).join('')
  const stop = new Set([
    '可能', '忽略', '没有', '一个', '一些', '你的', '你是', '已经', '时候',
    '事情', '是否', '某些', '方法', '身边', '已有', '当作', '询问',
  ])
  const words = []
  for (let i = 0; i < chars.length - 1; i++) {
    const w2 = chars.slice(i, i + 2)
    if (!stop.has(w2)) words.push(w2)
    if (i + 3 <= chars.length) {
      const w3 = chars.slice(i, i + 3)
      if (!stop.has(w3)) words.push(w3)
    }
  }
  return words
}

/** 判断日记内容是否与某个盲点相关 */
function journalMatches(blindspotText, journalContent) {
  if (!journalContent) return false
  const keywords = extractKeywords(blindspotText)
  return keywords.some((k) => journalContent.includes(k))
}

/** 成长阶段映射 */
function stageOf(growth) {
  if (growth >= MATURE_GROWTH) return 'mature'
  if (growth >= 1) return 'sprout'
  return 'seed'
}

module.exports = {
  MATURE_GROWTH,
  TRIGGER_TYPES,
  extractTheme,
  pickPlantName,
  buildMessage,
  journalMatches,
  stageOf,
}
