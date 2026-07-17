/**
 * 时间相关工具函数
 * 所有判断均使用客户端 new Date()
 */

/** 获取当前小时（0-23） */
export function currentHour(): number {
  return new Date().getHours()
}

/** 判断是否处于深夜时段 23:00 - 5:00 */
export function isLateNight(): boolean {
  const h = currentHour()
  return h >= 23 || h < 5
}

/** 时段问候语 */
export function greetingByTime(): string {
  const h = currentHour()
  if (h >= 5 && h < 12) {
    return '早上好。新的一天，带着什么样的心情醒来的？'
  }
  if (h >= 12 && h < 18) {
    return '下午的时光，是忙碌还是安静？想聊点什么吗？'
  }
  if (h >= 18 && h < 23) {
    return '夜晚慢慢降临，今天的你辛苦了。有什么想放下的话吗？'
  }
  // 23:00 - 5:00
  return '已经很晚了，世界安静下来。如果你需要陪伴，我在这里。'
}

/** 当前时段标签（用于氛围切换） */
export function timeLabel(): 'morning' | 'afternoon' | 'evening' | 'lateNight' {
  const h = currentHour()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'lateNight'
}

/** 格式化日期为 "7月17日 周五" */
export function formatDateCN(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

/** 格式化时间为 "23:14" */
export function formatTime(date: Date | string | number): string {
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** 生成简单 ID（前端临时用，正式会话 ID 由后端返回） */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
