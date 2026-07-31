import React from 'react'

/**
 * Echo 情绪果实树 Logo 组件
 *
 * 用途：导航栏品牌标识 / 空状态插图 / 加载页 / 我的角落页主视觉
 * 风格：简约线条风果树 + 马卡龙色果实 + 衬线体 "Echo" 文字
 */
interface EchoLogoProps {
  size?: 'sm' | 'lg' | 'xl'       // 尺寸规格
  showText?: boolean              // 是否显示 "Echo" 文字
  className?: string              // 自定义样式
  animated?: boolean              // 是否启用果实摇摆动画
}

const EchoLogo: React.FC<EchoLogoProps> = ({
  size = 'lg',
  showText = true,
  className = '',
  animated = false,
}) => {
  // 尺寸规格
  const sizes = {
    sm: { width: 120, height: 96, fontSize: 16, fruitSize: 6, strokeWidth: 2 },
    lg: { width: 200, height: 160, fontSize: 24, fruitSize: 9, strokeWidth: 2.5 },
    xl: { width: 280, height: 220, fontSize: 32, fruitSize: 12, strokeWidth: 3 },
  }

  const s = sizes[size]
  const animClass = animated ? 'animate-fruit-sway' : ''

  // 马卡龙色果实定义（位置、颜色、大小倍数）
  const fruits = [
    { cx: 65, cy: 85, color: '#FFB6C1', scale: 1 },   // 粉
    { cx: 135, cy: 75, color: '#DDA0DD', scale: 1.1 },  // 紫
    { cx: 75, cy: 65, color: '#ADD8E6', scale: 0.95 },  // 蓝
    { cx: 125, cy: 60, color: '#F0E68C', scale: 1 },     // 黄
    { cx: 95, cy: 55, color: '#98FB98', scale: 0.9 },    // 绿
    { cx: 55, cy: 70, color: '#FFB347', scale: 0.85 },   // 橙
    { cx: 145, cy: 90, color: '#FFB6C1', scale: 0.95 },  // 粉2
    { cx: 85, cy: 95, color: '#98FB98', scale: 1.05 },   // 绿2
    { cx: 115, cy: 88, color: '#ADD8E6', scale: 0.9 },   // 蓝2
    { cx: 70, cy: 45, color: '#F0E68C', scale: 0.8 },    // 黄2
    { cx: 140, cy: 55, color: '#FFB347', scale: 0.88 },  // 橙2
    { cx: 100, cy: 78, color: '#DDA0DD', scale: 0.92 },  // 紫2
    { cx: 60, cy: 92, color: '#ADD8E6', scale: 0.87 },   // 蓝3
    { cx: 130, cy: 100, color: '#98FB98', scale: 0.93 },  // 绿3
  ]

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox="0 0 200 160"
      className={`${animClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Echo 情绪果实树 Logo"
    >
      {/* ===== 树干 ===== */}
      <g stroke="#A67C52" fill="none" strokeLinecap="round">
        {/* 主干 */}
        <path
          d="M100 145 L100 80"
          strokeWidth={s.strokeWidth + 1}
        />
        {/* 分枝 */}
        <path
          d="M100 110 Q82 95 65 88"
          strokeWidth={s.strokeWidth}
        />
        <path
          d="M100 100 Q118 85 135 78"
          strokeWidth={s.strokeWidth}
        />
        <path
          d="M100 92 Q88 78 75 65"
          strokeWidth={s.strokeWidth - 0.5}
        />
        <path
          d="M100 95 Q112 78 125 60"
          strokeWidth={s.strokeWidth - 0.5}
        />
        <path
          d="M100 118 Q78 108 58 95"
          strokeWidth={s.strokeWidth - 0.3}
        />
        <path
          d="M100 115 Q122 105 142 92"
          strokeWidth={s.strokeWidth - 0.3}
        />
        {/* 小分枝 */}
        <path
          d="M72 78 Q62 72 55 68"
          strokeWidth={s.strokeWidth - 0.8}
        />
        <path
          d="M128 70 Q138 64 145 62"
          strokeWidth={s.strokeWidth - 0.8}
        />
      </g>

      {/* ===== 马卡龙果实 ===== */}
      {fruits.map((fruit, i) => (
        <circle
          key={i}
          cx={fruit.cx}
          cy={fruit.cy}
          r={s.fruitSize * fruit.scale}
          fill={fruit.color}
          opacity={0.9}
        />
      ))}

      {/* ===== 极小绿叶（部分果实） ===== */}
      <path d="M63 83 Q58 78 60 73 Q66 76 63 83" fill="#98FB98" opacity="0.7" />
      <path d="M138 68 Q143 63 141 58 Q135 61 138 68" fill="#98FB98" opacity="0.7" />
      <path d="M72 60 Q67 55 69 50 Q75 53 72 60" fill="#98FB98" opacity="0.6" />
      <path d="M128 55 Q133 50 131 45 Q125 48 128 55" fill="#98FB98" opacity="0.6" />

      {/* ===== "Echo" 衬线体文字 ===== */}
      {showText && (
        <text
          x={size === 'sm' ? 60 : size === 'lg' ? 100 : 140}
          y={size === 'sm' ? 110 : size === 'lg' ? 155 : 210}
          textAnchor="middle"
          fontFamily="Georgia, Palatino, 'Times New Roman', serif"
          fontSize={s.fontSize}
          fill="#A67C52"
          fontStyle="italic"
          letterSpacing="1"
        >
          Echo
        </text>
      )}
    </svg>
  )
}

export default EchoLogo
