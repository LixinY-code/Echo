import React from 'react'

/**
 * EmotionTree — 带笑脸表情的情绪果实树（CornerPage 主视觉）
 *
 * 基于 EchoLogo v3.0 扩展，每个果实上叠加可爱的笑脸/眯眼表情
 * 用于"我的角落"页面展示用户本周情绪成长
 *
 * @param emotionCount - 本周情绪数量，控制显示的果实个数
 * @param size - 尺寸规格
 * @param animated - 是否启用摇摆动画
 */
interface EmotionTreeProps {
  emotionCount: number
  size?: 'lg' | 'xl'
  animated?: boolean
  className?: string
}

/** 表情类型 */
type FaceType = 'smile' | 'happy' | 'blink' | 'joy' | 'warm' | 'shy'

/**
 * 果实定义（扩展自 EchoLogo，增加 face 字段）
 */
interface EmotionFruit {
  cx: number
  cy: number
  color: string
  scale: number
  hasStem?: boolean
  hasLeaf?: boolean
  face: FaceType
}

const EmotionTree: React.FC<EmotionTreeProps> = ({
  emotionCount,
  size = 'xl',
  animated = false,
  className = '',
}) => {
  // 尺寸规格
  const sizes = {
    lg: { width: 280, height: 260, fruitR: 13, strokeWidth: 3.5 },
    xl: { width: 380, height: 350, fruitR: 18, strokeWidth: 4.5 },
  }

  const s = sizes[size]
  const animClass = animated ? 'animate-fruit-sway' : ''

  // ===== 完整情绪果实列表（每个果实都有表情） =====
  const allFruits: EmotionFruit[] = [
    // === 左侧区域 ===
    { cx: 65, cy: 115, color: '#FFB347', scale: 1.1, hasStem: true, face: 'smile' },    // 橙-笑
    { cx: 48, cy: 148, color: '#FFB347', scale: 1.05, hasStem: true, face: 'happy' },   // 橙-开心
    { cx: 78, cy: 175, color: '#FFC8C8', scale: 0.9, face: 'warm' },                     // 浅粉-温暖
    { cx: 100, cy: 135, color: '#DDA0DD', scale: 0.95, face: 'blink' },                  // 紫-眨眼

    // === 中左区域 ===
    { cx: 125, cy: 92, color: '#FFE4D0', scale: 1.0, face: 'joy' },                      // 奶白-喜悦
    { cx: 108, cy: 72, color: '#FFB6C1', scale: 0.95, face: 'smile' },                   // 粉-微笑

    // === 顶部区域 ===
    { cx: 160, cy: 62, color: '#FFB6C1', scale: 1.0, hasLeaf: true, face: 'happy' },     // 粉-开心(叶)
    { cx: 195, cy: 68, color: '#FFC8C8', scale: 1.0, face: 'shy' },                      // 浅粉-害羞
    { cx: 175, cy: 95, color: '#FFDAB9', scale: 0.9, face: 'warm' },                     // 桃色-温暖

    // === 中右区域 ===
    { cx: 210, cy: 102, color: '#DDA0DD', scale: 1.08, face: 'joy' },                    // 紫-大喜悦
    { cx: 235, cy: 80, color: '#E8D5F0', scale: 0.95, face: 'blink' },                   // 浅紫-眨眼
    { cx: 188, cy: 125, color: '#F0E68C', scale: 0.92, hasLeaf: true, face: 'smile' },   // 黄-微笑(叶)

    // === 右侧区域 ===
    { cx: 248, cy: 128, color: '#F0E68C', scale: 1.0, face: 'happy' },                   // 黄-开心
    { cx: 220, cy: 155, color: '#ADD8E6', scale: 0.95, face: 'shy' },                    // 蓝-害羞
    { cx: 252, cy: 178, color: '#C8F0C8', scale: 0.92, hasLeaf: true, face: 'warm' },   // 浅绿-温暖(叶)

    // === 下部区域 ===
    { cx: 135, cy: 158, color: '#DDA0DD', scale: 0.9, face: 'blink' },                   // 紫-眨眼2
    { cx: 165, cy: 172, color: '#98FB98', scale: 0.95, face: 'smile' },                  // 绿-微笑
    { cx: 198, cy: 190, color: '#FFC8C8', scale: 0.85, face: 'joy' },                    // 浅粉-喜悦
    { cx: 130, cy: 185, color: '#ADD8E6', scale: 0.82, face: 'happy' },                 // 蓝-开心
    { cx: 230, cy: 205, color: '#F0E68C', scale: 0.8, face: 'shy' },                    // 黄-害羞
  ]

  // 根据情绪数量截取
  const displayFruits = allFruits.slice(0, Math.min(Math.max(emotionCount, 1), allFruits.length))

  /**
   * 渲染表情 SVG 路径
   * 每个表情由两个弧线眼睛 + 一个弧线嘴巴组成
   */
  const renderFace = (face: FaceType, cx: number, cy: number, r: number) => {
    const eyeOffset = r * 0.28
    const eyeSize = r * 0.12
    const eyeY = cy - r * 0.08
    const mouthY = cy + r * 0.18

    // 眼睛配置
    const eyes: Record<FaceType, { leftEye: string; rightEye: string }> = {
      smile: { leftEye: 'circle', rightEye: 'circle' },        // 圆眼微笑
      happy: { leftEye: 'circle', rightEye: 'circle' },         // 圆眼大笑
      blink: { leftEye: 'arc', rightEye: 'arc' },               // 弧线眨眼 ^ ^
      joy: { leftEye: 'arc', rightEye: 'arc' },                 // 弧线喜悦
      warm: { leftEye: 'dot', rightEye: 'dot' },                // 点眼温暖
      shy: { leftEye: 'circle', rightEye: 'circle' },           // 圆眼害羞
    }

    // 嘴巴配置
    const mouths: Record<FaceType, string> = {
      smile: `M ${cx - r * 0.22} ${mouthY} Q ${cx} ${mouthY + r * 0.18} ${cx + r * 0.22} ${mouthY}`,  // 微笑
      happy: `M ${cx - r * 0.2} ${mouthY - r * 0.02} Q ${cx} ${mouthY + r * 0.25} ${cx + r * 0.2} ${mouthY - r * 0.02}`, // 大笑
      blink: `M ${cx - r * 0.18} ${mouthY} Q ${cx} ${mouthY + r * 0.14} ${cx + r * 0.18} ${mouthY}`,   // 浅笑
      joy: `M ${cx - r * 0.2} ${mouthY - r * 0.04} Q ${cx} ${mouthY + r * 0.22} ${cx + r * 0.2} ${mouthY - r * 0.04}`, // 开心
      warm: `M ${cx - r * 0.16} ${mouthY + r * 0.02} Q ${cx} ${mouthY + r * 0.16} ${cx + r * 0.16} ${mouthY + r * 0.02}`, // 温暖浅笑
      shy: `M ${cx - r * 0.14} ${mouthY + r * 0.04} Q ${cx} ${mouthY + r * 0.12} ${cx + r * 0.14} ${mouthY + r * 0.04}`, // 害羞抿嘴
    }

    const eyeConfig = eyes[face]
    const mouthPath = mouths[face]
    const strokeColor = '#8B6240'
    const strokeWidth = Math.max(r * 0.07, 0.8)
    const cap = 'round'

    return (
      <g opacity={0.7}>
        {/* 左眼 */}
        {eyeConfig.leftEye === 'circle' ? (
          <circle cx={cx - eyeOffset} cy={eyeY} r={eyeSize} fill={strokeColor} />
        ) : eyeConfig.leftEye === 'arc' ? (
          <path d={`M ${cx - eyeOffset - eyeSize} ${eyeY + eyeSize * 0.5} Q ${cx - eyeOffset} ${eyeY - eyeSize * 0.3} ${cx - eyeOffset + eyeSize} ${eyeY + eyeSize * 0.5}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap={cap} />
        ) : (
          <circle cx={cx - eyeOffset} cy={eyeY} r={eyeSize * 0.7} fill={strokeColor} />
        )}

        {/* 右眼 */}
        {eyeConfig.rightEye === 'circle' ? (
          <circle cx={cx + eyeOffset} cy={eyeY} r={eyeSize} fill={strokeColor} />
        ) : eyeConfig.rightEye === 'arc' ? (
          <path d={`M ${cx + eyeOffset - eyeSize} ${eyeY + eyeSize * 0.5} Q ${cx + eyeOffset} ${eyeY - eyeSize * 0.3} ${cx + eyeOffset + eyeSize} ${eyeY + eyeSize * 0.5}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap={cap} />
        ) : (
          <circle cx={cx + eyeOffset} cy={eyeY} r={eyeSize * 0.7} fill={strokeColor} />
        )}

        {/* 嘴巴 */}
        <path d={mouthPath} stroke={strokeColor} strokeWidth={strokeWidth + 0.3} fill="none" strokeLinecap={cap} />

        {/* 腮红（仅部分表情） */}
        {(face === 'shy' || face === 'warm') && (
          <>
            <ellipse cx={cx - eyeOffset * 1.6} cy={eyeY + r * 0.15} rx={eyeSize * 1.2} ry={eyeSize * 0.7} fill="#FFB6C1" opacity={0.35} />
            <ellipse cx={cx + eyeOffset * 1.6} cy={eyeY + r * 0.15} rx={eyeSize * 1.2} ry={eyeSize * 0.7} fill="#FFB6C1" opacity={0.35} />
          </>
        )}
      </g>
    )
  }

  /**
   * 渲染单个带表情的水彩果实
   */
  const renderEmotionFruit = (fruit: EmotionFruit, i: number) => {
    const r = s.fruitR * fruit.scale
    const { cx, cy, color } = fruit
    const gradId = `emotion-grad-${size}-${i}-${color.replace('#', '')}`

    return (
      <g key={i}>
        <defs>
          <radialGradient id={gradId} cx="32%" cy="28%" r="58%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="35%" stopColor={color} stopOpacity={0.88} />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 蒂 */}
        {fruit.hasStem && (
          <path
            d={`M ${cx - 2.5} ${cy - r - 1.5} Q ${cx} ${cy - r - 6} ${cx + 2.5} ${cy - r - 1.5}`}
            stroke="#C67B4E"
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* 果实主体 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#${gradId})`}
          stroke={color}
          strokeWidth={0.6}
          opacity={0.92}
          className={animClass}
          style={{ animationDelay: `${i * 0.12}s`, transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* 表情 */}
        {renderFace(fruit.face, cx, cy, r)}

        {/* 小绿叶 */}
        {fruit.hasLeaf && (
          <g transform={`translate(${cx + r * 0.72}, ${cy - r * 0.55}) rotate(${25 + i * 12})`}>
            <ellipse rx={r * 0.3} ry={r * 0.17} fill="#A8C5A0" opacity={0.7} />
            <line x1={-r * 0.06} y1={0} x2={r * 0.22} y2={0} stroke="#7FA176" strokeWidth={0.5} />
          </g>
        )}
      </g>
    )
  }

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox="0 0 300 280"
      className={`${animClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`情绪果实树 — 本周 ${displayFruits.length} 个情绪`}
    >
      <defs>
        {/* 树干渐变 */}
        <linearGradient id={`et-trunk-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B88A5E" />
          <stop offset="50%" stopColor="#A67C52" />
          <stop offset="100%" stopColor="#8B6240" />
        </linearGradient>
        {/* 树冠光晕 */}
        <radialGradient id={`et-glow-${size}`} cx="48%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#FFF5E6" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#FFF5E6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFF5E6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 光晕背景 */}
      <ellipse cx="150" cy="115" rx="120" ry="100" fill={`url(#et-glow-${size})`} />

      {/* ===== 树干系统 ===== */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* 主干 */}
        <path d="M152 260 Q146 205 150 158 Q152 128 157 102" stroke="#8B6240" strokeWidth={s.strokeWidth + 2} fill="none" />
        <path d="M152 260 Q146 205 150 158 Q152 128 157 102" stroke={`url(#et-trunk-${size})`} strokeWidth={s.strokeWidth} fill="none" />

        {/* 一级分枝 */}
        <path d="M152 178 Q125 158 95 138 Q70 122 52 105" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.72} fill="none" />
        <path d="M152 165 Q178 145 208 125 Q232 108 255 98" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.72} fill="none" />
        <path d="M152 145 Q134 122 115 96 Q100 75 90 60" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.56} fill="none" />
        <path d="M152 138 Q170 115 192 88 Q208 68 222 55" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.56} fill="none" />

        {/* 二级分枝 */}
        <path d="M95 138 Q78 128 62 138 Q48 148 40 162" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.42} fill="none" />
        <path d="M208 125 Q225 136 242 148 Q255 158 252 175" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.42} fill="none" />
        <path d="M115 96 Q100 84 85 72" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.32} fill="none" />
        <path d="M192 88 Q210 76 228 68" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.32} fill="none" />

        {/* 三级小枝 */}
        <path d="M52 105 Q42 94 32 86" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.24} fill="none" />
        <path d="M255 98 Q268 90 280 84" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.24} fill="none" />
        <path d="M150 195 Q172 206 194 214" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
        <path d="M150 202 Q130 214 112 225" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
        <path d="M62 138 Q50 150 38 162" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.22} fill="none" />
        <path d="M242 148 Q256 158 270 168" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.22} fill="none" />
      </g>

      {/* ===== 带表情的情绪果实 ===== */}
      {displayFruits.map(renderEmotionFruit)}
    </svg>
  )
}

export default EmotionTree
