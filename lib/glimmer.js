// ============================================================
// Glimmer Quests —— 微光任务池与每日选取（CommonJS）
//
// 设计理念：比 Reality Quest 更轻量、更随机，像生活里的小彩蛋。
//  - 每天 1-3 个，基于用户近期情绪（user_profiles.emotion_history）
//    和当前时段（Asia/Shanghai）筛选
//  - 选取以 userId + 日期为随机种子：同一天内刷新结果一致，
//    午夜自然更换，未做的任务自动"消失"（不再返回）
//  - 无排行榜、无惩罚，文案保持 Echo 的温柔语气
// ============================================================

/**
 * 任务池
 * key     唯一标识
 * text    任务文案（第二人称、轻量、生活化）
 * emoji   小图标
 * times   适用时段：morning(5-11) / afternoon(11-17) / evening(17-22) / lateNight(22-5)，'any' 表示全天
 * moods   可选：情绪加成关键词（匹配 emotion_history 里的中文情绪词，如 焦虑/低落/迷茫）
 */
const QUEST_POOL = [
  // ---- 清晨 ----
  { key: 'curtain-green', text: '拉开窗帘，数一数窗外能看到的三种绿色', emoji: '🌿', times: ['morning'] },
  { key: 'first-water', text: '喝今天第一口水时，认真感受它的温度', emoji: '💧', times: ['morning'] },
  { key: 'mirror-wink', text: '路过镜子时，对里面的自己眨一下眼', emoji: '🪞', times: ['morning', 'any'] },
  { key: 'mood-emoji', text: '给今天的自己挑一个心情表情，不用理由', emoji: '🎈', times: ['morning', 'any'] },
  // ---- 午后 ----
  { key: 'sky-photo', text: '拍下此刻天空的颜色，存进今天的日记', emoji: '🌤️', times: ['afternoon', 'morning'] },
  { key: 'old-song', text: '找一首很久没听的歌，只听 30 秒', emoji: '🎵', times: ['afternoon', 'any'] },
  { key: 'desk-angle', text: '把桌上的一样小东西，摆成你喜欢的角度', emoji: '📐', times: ['afternoon', 'any'] },
  { key: 'secret-note', text: '给未来的自己写一句只有你能看懂的话', emoji: '✉️', times: ['afternoon', 'evening'] },
  { key: 'plant-photo', text: '给一株植物（或一片叶子）拍张照', emoji: '🪴', times: ['afternoon', 'morning'], moods: ['平静', '感激'] },
  // ---- 傍晚 ----
  { key: 'type-delete', text: '在聊天框打一句真心话，然后一个字一个字删掉', emoji: '🫧', times: ['evening', 'lateNight'] },
  { key: 'old-photo-smell', text: '找一张旧照片，试着回想那天空气的味道', emoji: '🎞️', times: ['evening', 'lateNight'] },
  { key: 'small-win', text: '写下今天一个「还不错」的瞬间，哪怕特别小', emoji: '🌟', times: ['evening', 'any'], moods: ['低落', '焦虑'] },
  { key: 'thank-you', text: '对今天遇到的一个善意说声谢谢，在心里也行', emoji: '💛', times: ['evening', 'any'], moods: ['感激', '平静'] },
  { key: 'star-night', text: '抬头找一颗星星，跟它说声晚安', emoji: '⭐', times: ['evening', 'lateNight'] },
  // ---- 深夜 ----
  { key: 'night-sound', text: '闭上眼睛，听 30 秒夜晚的声音', emoji: '🌙', times: ['lateNight'] },
  { key: 'phone-down', text: '把手机屏幕朝下，慢慢深呼吸三次', emoji: '🍃', times: ['lateNight'], moods: ['焦虑', '压力'] },
  { key: 'pillow-name', text: '给枕头取一个名字（今晚限定）', emoji: '☁️', times: ['lateNight'] },
  { key: 'tomorrow-hope', text: '想一件明天醒来值得期待的小事', emoji: '🌅', times: ['lateNight', 'evening'], moods: ['低落', '迷茫'] },
  // ---- 全天 / 情绪照护 ----
  { key: 'soft-hug', text: '抱一抱你身边最柔软的东西', emoji: '🧸', times: ['any'], moods: ['低落', '焦虑', '难过'] },
  { key: 'warm-water', text: '慢慢喝完一杯温水，顺便数一数咽了几次', emoji: '🍵', times: ['any'], moods: ['焦虑', '压力'] },
  { key: 'three-things', text: '说出三件你现在眼睛能看到的东西', emoji: '👀', times: ['any'], moods: ['焦虑', '迷茫'] },
  { key: 'shoulder-drop', text: '把肩膀放松下来，保持五秒', emoji: '🫠', times: ['any'], moods: ['焦虑', '压力', '疲惫'] },
]

/** 当前上海时区的日期串 YYYY-MM-DD 与小时 */
function shanghaiNow() {
  const now = new Date()
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  const hour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai', hour: 'numeric', hour12: false }),
    10,
  ) % 24
  return { date, hour }
}

/** 时段分桶 */
function timeBucket(hour) {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'lateNight'
}

/** 简单字符串 hash（选取种子） */
function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** mulberry32 伪随机（种子确定性） */
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 为用户选取今日微光任务（确定性：同人同一天结果一致）
 * @param {string} userId
 * @param {string} dateStr YYYY-MM-DD（上海时区）
 * @param {number} hour 当前小时（上海时区）
 * @param {string[]} recentEmotions 近期情绪词（来自 emotion_history）
 * @returns {{key:string,text:string,emoji:string}[]} 1-3 个任务
 */
function pickDailyQuests(userId, dateStr, hour, recentEmotions) {
  const bucket = timeBucket(hour)
  const rand = mulberry32(hashStr(`${userId}:${dateStr}`))

  // 1) 时段过滤（'any' 全天通用）
  let pool = QUEST_POOL.filter((q) => q.times.includes(bucket) || q.times.includes('any'))

  // 2) 情绪加成：近期情绪命中的任务权重翻倍（复制一份加大被抽中概率）
  const moods = (recentEmotions || []).filter(Boolean)
  if (moods.length > 0) {
    const boosted = pool.filter(
      (q) => q.moods && q.moods.some((m) => moods.some((e) => e.includes(m) || m.includes(e))),
    )
    pool = pool.concat(boosted)
  }

  // 3) 种子洗牌
  const shuffled = pool
    .map((q) => ({ q, r: rand() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.q)

  // 4) 去重（情绪加成可能复制了同 key）
  const seen = new Set()
  const unique = shuffled.filter((q) => {
    if (seen.has(q.key)) return false
    seen.add(q.key)
    return true
  })

  // 5) 数量 1-3（多数为 2）
  const count = 1 + (rand() < 0.6 ? 1 : 0) + (rand() < 0.25 ? 1 : 0)
  return unique.slice(0, count).map((q) => ({ key: q.key, text: q.text, emoji: q.emoji }))
}

module.exports = { QUEST_POOL, shanghaiNow, timeBucket, pickDailyQuests }
