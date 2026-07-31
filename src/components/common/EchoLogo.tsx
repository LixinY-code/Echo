import React from 'react'

/**
 * Echo 情绪果实树 Logo 组件（v3.0 水彩风格）
 *
 * 用途：导航栏品牌标识 / 空状态插图 / 加载页 / 我的角落页主视觉
 * 风格：水彩风粗树干 + 大号马卡龙果实（带高光/蒂/叶）+ 衬线体 "Echo" 文字
 *
 * v3.0 更新（对齐图一参考）：
 *  - 树干加粗 + 填充色，更有质感
 *  - 果实增大，添加径向渐变模拟水彩高光
 *  - 部分果实带小蒂（orange）或绿叶
 *  - 整体更柔和可爱
 */
interface EchoLogoProps {
  size?: 'sm' | 'lg' | 'xl'       // 尺寸规格
  showText?: boolean              // 是否显示 "Echo" 文字
  className?: string              // 自定义样式
  animated?: boolean              // 是否启用果实摇摆动画
  /** v3.0: 动态情绪果实模式 — 传入本周情绪数量，控制果实显示个数 */
  emotionCount?: number
}

/**
 * 果实定义
 * @param cx, cy - 位置
 * @param color - 基础色
 * @param scale - 大小倍数
 * @param hasStem - 是否有蒂（橙色果实特有）
 * @param hasLeaf - 是否有小绿叶
 */
interface FruitDef {
  cx: number
  cy: number
  color: string
  scale: number
  hasStem?: boolean
  hasLeaf?: boolean
}

const EchoLogo: React.FC<EchoLogoProps> = ({
  size = 'lg',
  showText = true,
  className = '',
  animated = false,
  emotionCount,
}) => {
  // 尺寸规格（v3.0 调大）
  const sizes = {
    sm: { width: 120, height: 110, fontSize: 15, fruitR: 7, strokeWidth: 2.5 },
    lg: { width: 220, height: 200, fontSize: 24, fruitR: 11, strokeWidth: 3 },
    xl: { width: 340, height: 310, fontSize: 34, fruitR: 16, strokeWidth: 4 },
  }

  const s = sizes[size]
  const animClass = animated ? 'animate-fruit-sway' : ''

  // ===== 完整果实列表（按视觉层次排列） =====
  const allFruits: FruitDef[] = [
    // === 左侧枝 ===
    { cx: 50, cy: 85, color: '#FFB347', scale: 1.1, hasStem: true },     // 橙1（带蒂）
    { cx: 38, cy: 110, color: '#FFB347', scale: 1.0, hasStem: true },   // 橙2（带蒂）
    { cx: 58, cy: 130, color: '#FFC8C8', scale: 0.85 },                  // 浅粉
    { cx: 75, cy: 100, color: '#DDA0DD', scale: 0.9 },                   // 紫

    // === 中左枝 ===
    { cx: 95, cy: 70, color: '#FFE4D0', scale: 1.0 },                    // 奶白粉
    { cx: 82, cy: 55, color: '#FFB6C1', scale: 0.9 },                    // 粉1

    // === 顶部枝 ===
    { cx: 125, cy: 48, color: '#FFB6C1', scale: 0.95, hasLeaf: true },   // 粉2（带叶）
    { cx: 155, cy: 52, color: '#FFC8C8', scale: 1.0 },                    // 浅粉2
    { cx: 140, cy: 72, color: '#FFDAB9', scale: 0.85 },                   // 桃色

    // === 中右枝 ===
    { cx: 168, cy: 78, color: '#DDA0DD', scale: 1.05 },                   // 紫2（大）
    { cx: 185, cy: 62, color: '#E8D5F0', scale: 0.9 },                    // 浅紫
    { cx: 150, cy: 95, color: '#F0E68C', scale: 0.88, hasLeaf: true },   // 黄（带叶）

    // === 右侧枝 ===
    { cx: 200, cy: 98, color: '#F0E68C', scale: 1.0 },                    // 黄2
    { cx: 178, cy: 118, color: '#ADD8E6', scale: 0.92 },                  // 蓝
    { cx: 195, cy: 135, color: '#C8F0C8', scale: 0.88, hasLeaf: true },  // 浅绿（带叶）

    // === 下部枝 ===
    { cx: 105, cy: 118, color: '#DDA0DD', scale: 0.87 },                  // 紫3
    { cx: 130, cy: 128, color: '#98FB98', scale: 0.9 },                   // 绿
    { cx: 155, cy: 140, color: '#FFC8C8', scale: 0.82 },                  // 浅粉3
  ]

  // 如果指定了 emotionCount，只显示前 N 个果实
  const displayFruits = typeof emotionCount === 'number'
    ? allFruits.slice(0, Math.min(emotionCount, allFruits.length))
    : allFruits

  /**
   * 渲染单个水彩果实（带径向渐变高光）
   */
  const renderFruit = (fruit: FruitDef, i: number) => {
    const r = s.fruitR * fruit.scale
    const { cx, cy, color } = fruit

    // 为每个颜色生成唯一 ID（避免 SVG id 冲突）
    const gradId = `fruit-grad-${size}-${i}-${color.replace('#', '')}`

    return (
      <g key={i}>
        {/* 定义径向渐变（模拟水彩高光） */}
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="40%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 蒂（仅 orange 果实） */}
        {fruit.hasStem && (
          <path
            d={`M ${cx - 2} ${cy - r - 1} Q ${cx} ${cy - r - 5} ${cx + 2} ${cy - r - 1}`}
            stroke="#C67B4E"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* 果实主体（圆形 + 径向渐变） */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#${gradId})`}
          stroke={color}
          strokeWidth={0.5}
          opacity={0.92}
          className={animClass}
          style={{ animationDelay: `${i * 0.15}s` }}
        />

        {/* 小绿叶 */}
        {fruit.hasLeaf && (
          <g transform={`translate(${cx + r * 0.7}, ${cy - r * 0.5}) rotate(${30 + i * 15})`}>
            <ellipse rx={r * 0.28} ry={r * 0.16} fill="#A8C5A0" opacity="0.75" />
            <line x1={-r * 0.05} y1={0} x2={r * 0.2} y2={0} stroke="#7FA176" strokeWidth={0.4} />
          </g>
        )}
      </g>
    )
  }

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox="0 0 240 230"
      className={`${animClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Echo 情绪果实树 Logo"
    >
      {/* ===== 定义区 ===== */}
      <defs>
        {/* 树干渐变填充 */}
        <linearGradient id={`trunk-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B88A5E" />
          <stop offset="50%" stopColor="#A67C52" />
          <stop offset="100%" stopColor="#8B6240" />
        </linearGradient>
        {/* 树冠背景光晕 */}
        <radialGradient id={`canopy-glow-${size}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF5E6" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#FFF5E6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFF5E6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ===== 树冠光晕背景 ===== */}
      <ellipse cx="125" cy="95" rx="95" ry="80" fill={`url(#canopy-glow-${size})`} />

      {/* ===== 树干（v3.0：加粗 + 渐变填充） ===== */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* 主干（填充 + 描边） */}
        <path
          d="M122 210 Q118 170 120 130 Q121 105 125 85"
          stroke="#8B6240"
          strokeWidth={s.strokeWidth + 2}
          fill="none"
        />
        <path
          d="M122 210 Q118 170 120 130 Q121 105 125 85"
          stroke={`url(#trunk-grad-${size})`}
          strokeWidth={s.strokeWidth}
          fill="none"
        />

        {/* 主分枝 */}
        <path d="M122 145 Q100 130 75 115 Q55 100 42 88" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.75} fill="none" />
        <path d="M122 135 Q145 118 168 100 Q188 85 202 80" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.75} fill="none" />
        <path d="M122 118 Q108 100 95 78 Q85 60 80 50" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.6} fill="none" />
        <path d="M122 112 Q138 95 155 72 Q168 52 178 45" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.6} fill="none" />

        {/* 二级分枝 */}
        <path d="M75 115 Q62 108 50 115 Q40 122 35 132" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.45} fill="none" />
        <path d="M168 100 Q180 108 192 118 Q200 128 198 140" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.45} fill="none" />
        <path d="M95 78 Q82 68 72 58" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.35} fill="none" />
        <path d="M155 72 Q168 62 182 58" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.35} fill="none" />

        {/* 三级小枝 */}
        <path d="M50 115 Q42 106 35 100" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.25} fill="none" />
        <path d="M192 118 Q202 112 212 108" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.25} fill="none" />
        <path d="M120 155 Q138 162 155 168" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
        <path d="M120 160 Q105 170 92 178" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
      </g>

      {/* ===== 水彩果实 ===== */}
      {displayFruits.map(renderFruit)}

      {/* ===== "Echo" 衬线体文字 ===== */}
      {showText && (
        <text
          x={size === 'sm' ? 60 : size === 'lg' ? 120 : 175}
          y={size === 'sm' ? 128 : size === 'lg' ? 195 : 295}
          textAnchor="middle"
          fontFamily="Georgia, Palatino, 'Times New Roman', serif"
          fontSize={s.fontSize}
          fontWeight={600}
          fill="#A67C52"
          fontStyle="italic"
          letterSpacing="1.5"
        >
          Echo
        </text>
      )}
    </svg>
  )
}

export default EchoLogo
