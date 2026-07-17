/**
 * HandDrawnIcon — 手绘风格 SVG 图标库
 * 设计原则：线条带有轻微粗细变化、不追求完美几何对称，
 * 营造手帐般的温暖手作感。所有图标统一 24x24 viewBox，
 * stroke 使用 currentColor，可通过 className 控制颜色与尺寸。
 */
import type { CSSProperties, ReactNode } from 'react'

export type IconName =
  | 'mirror'
  | 'journal'
  | 'insight'
  | 'corner'
  | 'paper-plane'
  | 'lamp'
  | 'candle'
  | 'leaf'
  | 'sprout'
  | 'flower'
  | 'moon'
  | 'sun'
  | 'heart'
  | 'breath'
  | 'plus'
  | 'trash'
  | 'refresh'
  | 'arrow-left'
  | 'chevron-down'
  | 'sparkle'
  | 'eye'
  | 'compass'

interface Props {
  name: IconName
  className?: string
  style?: CSSProperties
}

/** 图标路径表：每个图标是一组 JSX <path>/<元素> */
const PATHS: Record<IconName, ReactNode> = {
  // 镜子（应用标识）
  mirror: (
    <>
      <ellipse cx="12" cy="10" rx="6.5" ry="8" />
      <path d="M12 18v3.5" />
      <path d="M8 21.5h8" />
    </>
  ),
  // 日记本
  journal: (
    <>
      <path d="M6 4.5h10a2 2 0 0 1 2 2V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5z" />
      <path d="M6 4.5C6 3.7 6.7 3 7.5 3H16" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  // 洞察（信封/信件）
  insight: (
    <>
      <rect x="4" y="6" width="16" height="13" rx="1.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  // 角落（小花园/植物）
  corner: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c-2-3-5-3-5-6 0 2.5 2 4 5 4z" />
      <path d="M12 13c2-2.5 4-2 4-5 0 2-1.5 3.2-4 3.5z" />
      <path d="M7 21h10" />
    </>
  ),
  // 纸飞机（发送）
  'paper-plane': (
    <>
      <path d="M21 4L3 11l6 2.5" />
      <path d="M21 4l-4 16-6-6.5" />
      <path d="M9 13.5V19l3-3" />
    </>
  ),
  // 台灯
  lamp: (
    <>
      <path d="M8 4l8 0 2 7c-2 1.5-8 1.5-10 0z" />
      <path d="M12 11v8" />
      <path d="M8 21h8" />
      <circle cx="12" cy="7" r="5" opacity="0.15" fill="currentColor" stroke="none" />
    </>
  ),
  // 蜡烛
  candle: (
    <>
      <path d="M9 20h6l1-8H8z" />
      <path d="M12 12V8" />
      <path d="M12 8c-1.2-1-1.2-2.5 0-4 1.2 1.5 1.2 3 0 4z" />
    </>
  ),
  // 叶子
  leaf: (
    <>
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19c4-6 8-9 12-11" />
    </>
  ),
  // 嫩芽
  sprout: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3-3-5-6-5 0 3 3 5 6 5z" />
      <path d="M12 11c0-2 2-4 5-4 0 2-2 4-5 4z" />
    </>
  ),
  // 花朵
  flower: (
    <>
      <circle cx="12" cy="9" r="2.2" />
      <path d="M12 9c-3-2-3-5 0-6 3 1 3 4 0 6zM12 9c3 2 3 5 0 6-3-1-3-4 0-6z" />
      <path d="M12 15v6" />
    </>
  ),
  // 月亮
  moon: (
    <>
      <path d="M19 13a7 7 0 1 1-8-9 5.5 5.5 0 0 0 8 9z" />
    </>
  ),
  // 太阳
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  // 心
  heart: (
    <>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </>
  ),
  // 呼吸圆环
  breath: (
    <>
      <circle cx="12" cy="12" r="7" opacity="0.4" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  // 加号
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  // 删除
  trash: (
    <>
      <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" />
    </>
  ),
  // 刷新
  refresh: (
    <>
      <path d="M19 12a7 7 0 1 1-2-5" />
      <path d="M19 4v4h-4" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M15 5l-7 7 7 7" />
    </>
  ),
  'chevron-down': (
    <>
      <path d="M6 9l6 7 6-7" />
    </>
  ),
  // 星光/闪光
  sparkle: (
    <>
      <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" />
    </>
  ),
  // 眼睛（觉察/盲点）
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // 指南针（方向/换框）
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
}

export default function HandDrawnIcon({ name, className = 'w-6 h-6', style }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
