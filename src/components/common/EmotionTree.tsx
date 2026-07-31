import React, { useState } from 'react'

/**
 * EmotionTree — 数据驱动的情绪果实树（v4.0）
 *
 * 核心变化：
 *  - 从硬编码果实列表改为接收后端数据（EmotionFruitData[]）
 *  - 每颗果实对应一次对话，带情绪类型/颜色/300字总结
 *  - 鼠标悬停弹出 Tooltip 显示聊天总结
 *  - emotion_type 自动映射到果实表情（哭脸/笑脸/皱眉等）
 *
 * @param fruits - 来自后端的情绪果实数据数组
 * @param size - 尺寸规格
 * @param animated - 是否启用摇摆动画
 */

/** 后端返回的情绪果实数据 */
export interface EmotionFruitData {
  sessionId: string
  title: string
  emotionType: 'joy' | 'warm' | 'sad' | 'anxious' | 'confused' | 'calm'
  emotionColor: string       // 马卡龙色 hex
  summary300: string         // 300 字总结（悬停显示）
  messageCount: number
  createdAt: string          // ISO
  updatedAt?: string
}

interface EmotionTreeProps {
  /** 来自 /api/emotion-fruits 的数据 */
  fruits?: EmotionFruitData[]
  /** 兜底：没有数据时显示的装饰性果实数量 */
  fallbackCount?: number
  size?: 'lg' | 'xl'
  animated?: boolean
  className?: string
}

/** 表情类型（SVG 渲染用） */
type FaceType = 'smile' | 'happy' | 'blink' | 'joy' | 'warm' | 'shy' | 'cry' | 'worried' | 'pensive' | 'calm'

/**
 * emotion_type → face 映射表
 * 确保每种情绪对应一个独特的表情
 */
const EMOTION_TO_FACE: Record<EmotionFruitData['emotionType'], FaceType> = {
  joy: 'happy',      // 开心 → 大笑
  warm: 'warm',      // 温暖 → 点眼浅笑 + 腮红
  sad: 'cry',        // 难过 → 哭脸（眼泪）
  anxious: 'worried',// 焦虑 → 皱眉担心
  confused: 'pensive', // 迷茫 → 困惑表情
  calm: 'calm',      // 平静 → 宁静微笑
}

/** 预定义的位置模板（22 个位置，按视觉层次排列） */
const FRUIT_POSITIONS = [
  { cx: 65, cy: 115, scale: 1.1, hasStem: true },   // 左下-大
  { cx: 48, cy: 148, scale: 1.05, hasStem: true },   // 左底
  { cx: 78, cy: 175, scale: 0.9 },                    // 左下角
  { cx: 100, cy: 135, scale: 0.95 },                  // 左中
  { cx: 125, cy: 92, scale: 1.0 },                     // 中左上
  { cx: 108, cy: 72, scale: 0.95 },                    // 左顶
  { cx: 160, cy: 62, scale: 1.0, hasLeaf: true },     // 正顶(叶)
  { cx: 195, cy: 68, scale: 1.0 },                     // 右顶
  { cx: 175, cy: 95, scale: 0.9 },                     // 中上
  { cx: 210, cy: 102, scale: 1.08 },                   // 右中大
  { cx: 235, cy: 80, scale: 0.95 },                    // 右上
  { cx: 188, cy: 125, scale: 0.92, hasLeaf: true },    // 中右(叶)
  { cx: 248, cy: 128, scale: 1.0 },                    // 右中
  { cx: 220, cy: 155, scale: 0.95 },                   // 右下
  { cx: 252, cy: 178, scale: 0.92, hasLeaf: true },    // 右底(叶)
  { cx: 135, cy: 158, scale: 0.9 },                    // 中下左
  { cx: 165, cy: 172, scale: 0.95 },                   // 中下
  { cx: 198, cy: 190, scale: 0.85 },                   // 下中右
  { cx: 130, cy: 185, scale: 0.82 },                   // 左底2
  { cx: 230, cy: 205, scale: 0.8 },                    // 最右下
  { cx: 85, cy: 95, scale: 0.88 },                     // 左上补充
  { cx: 145, cy: 140, scale: 0.87 },                   // 中心补充
]

/** 默认颜色（用于 fallback 模式） */
const FALLBACK_COLORS = [
  '#FFB6C1', '#FFB347', '#FFE4D0', '#DDA0DD', '#F0E68C',
  '#ADD8E6', '#98FB98', '#FFC8C8', '#FFDAB9', '#E8D5F0',
  '#C8F0C8',
]

/** 默认表情序列（fallback 循环） */
const FALLBACK_FACES: FaceType[] = ['smile', 'happy', 'warm', 'blink', 'joy', 'shy']

const EmotionTree: React.FC<EmotionTreeProps> = ({
  fruits,
  fallbackCount = 6,
  size = 'xl',
  animated = false,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // 尺寸规格
  const sizes = {
    lg: { width: 280, height: 260, fruitR: 13, strokeWidth: 3.5 },
    xl: { width: 380, height: 350, fruitR: 18, strokeWidth: 4.5 },
  }

  const s = sizes[size]
  const animClass = animated ? 'animate-fruit-sway' : ''

  /**
   * 构建渲染用的果实列表：
   *  - 有真实数据时：使用后端数据映射到位置
   *  - 无数据时：使用 fallback 装饰性果实
   */
  const renderFruits = (() => {
    if (fruits && fruits.length > 0) {
      return fruits.map((fruit, i) => ({
        ...FRUIT_POSITIONS[i % FRUIT_POSITIONS.length],
        color: fruit.emotionColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        face: EMOTION_TO_FACE[fruit.emotionType] || 'warm',
        // 携带元数据供 hover 使用
        meta: fruit,
      }))
    }
    // Fallback：装饰性果实
    return Array.from({ length: Math.min(fallbackCount, FRUIT_POSITIONS.length) }, (_, i) => ({
      ...FRUIT_POSITIONS[i],
      color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      face: FALLBACK_FACES[i % FALLBACK_FACES.length],
      meta: null as EmotionFruitData | null,
    }))
  })()

  /**
   * 渲染表情 SVG 路径（扩展支持 cry/worried/pensive/calm）
   */
  const renderFace = (face: FaceType, cx: number, cy: number, r: number) => {
    const eyeOffset = r * 0.28
    const eyeSize = r * 0.12
    const eyeY = cy - r * 0.08
    const mouthY = cy + r * 0.18
    const strokeColor = '#8B6240'
    const sw = Math.max(r * 0.07, 0.8)
    const cap = 'round'

    // 眼睛配置（扩展 4 种新表情）
    const eyes: Record<FaceType, { left: string; right: string }> = {
      smile: { left: 'circle', right: 'circle' },
      happy: { left: 'circle', right: 'circle' },
      blink: { left: 'arc', right: 'arc' },
      joy: { left: 'arc', right: 'arc' },
      warm: { left: 'dot', right: 'dot' },
      shy: { left: 'circle', right: 'circle' },
      cry: { left: 'cry-eye', right: 'cry-eye' },       // 哭眼（泪滴）
      worried: { left: 'worried-brow', right: 'worried-brow' }, // 皱眉
      pensive: { left: 'arc', right: 'arc' },              // 困惑弧线
      calm: { left: 'calm-curve', right: 'calm-curve' },   // 平静弯眼
    }

    // 嘴巴配置（扩展）
    const mouths: Record<FaceType, string> = {
      smile: `M ${cx - r * 0.22} ${mouthY} Q ${cx} ${mouthY + r * 0.18} ${cx + r * 0.22} ${mouthY}`,
      happy: `M ${cx - r * 0.2} ${mouthY - r * 0.02} Q ${cx} ${mouthY + r * 0.25} ${cx + r * 0.2} ${mouthY - r * 0.02}`,
      blink: `M ${cx - r * 0.18} ${mouthY} Q ${cx} ${mouthY + r * 0.14} ${cx + r * 0.18} ${mouthY}`,
      joy: `M ${cx - r * 0.2} ${mouthY - r * 0.04} Q ${cx} ${mouthY + r * 0.22} ${cx + r * 0.2} ${mouthY - r * 0.04}`,
      warm: `M ${cx - r * 0.16} ${mouthY + r * 0.02} Q ${cx} ${mouthY + r * 0.16} ${cx + r * 0.16} ${mouthY + r * 0.02}`,
      shy: `M ${cx - r * 0.14} ${mouthY + r * 0.04} Q ${cx} ${mouthY + r * 0.12} ${cx + r * 0.14} ${mouthY + r * 0.04}`,
      cry: `M ${cx - r * 0.16} ${mouthY + r * 0.06} Q ${cx} ${mouthY + r * 0.1} ${cx + r * 0.16} ${mouthY + r * 0.06}`, // 嘟嘴
      worried: `M ${cx - r * 0.14} ${mouthY + r * 0.08} Q ${cx} ${mouthY - r * 0.02} ${cx + r * 0.14} ${mouthY + r * 0.08}`, // 担心嘴
      pensive: `M ${cx - r * 0.12} ${mouthY + r * 0.04} Q ${cx} ${mouthY + r * 0.08} ${cx + r * 0.12} ${mouthY + r * 0.04}`, // 浅弧
      calm: `M ${cx - r * 0.18} ${mouthY} Q ${cx} ${mouthY + r * 0.12} ${cx + r * 0.18} ${mouthY}`, // 宁静微笑
    }

    const eyeCfg = eyes[face]
    const mouthPath = mouths[face]

    return (
      <g opacity={0.7}>
        {/* 左眼 */}
        {eyeCfg.left === 'circle' ? (
          <circle cx={cx - eyeOffset} cy={eyeY} r={eyeSize} fill={strokeColor} />
        ) : eyeCfg.left === 'arc' ? (
          <path d={`M ${cx - eyeOffset - eyeSize} ${eyeY + eyeSize * 0.5} Q ${cx - eyeOffset} ${eyeY - eyeSize * 0.3} ${cx - eyeOffset + eyeSize} ${eyeY + eyeSize * 0.5}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap={cap} />
        ) : eyeCfg.left === 'dot' ? (
          <circle cx={cx - eyeOffset} cy={eyeY} r={eyeSize * 0.7} fill={strokeColor} />
        ) : eyeCfg.left === 'cry-eye' ? (
          <>
            <circle cx={cx - eyeOffset} cy={eyeY} r={eyeSize * 0.9} fill={strokeColor} />
            {/* 泪滴 */}
            <ellipse cx={cx - eyeOffset - eyeSize * 0.6} cy={eyeY + eyeSize * 1.4} rx={eyeSize * 0.35} ry={eyeSize * 0.6} fill="#ADD8E6" opacity={0.6} />
          </>
        ) : eyeCfg.left === 'worried-brow' ? (
          <>
            <path d={`M ${cx - eyeOffset - eyeSize * 1.2} ${eyeY - eyeSize * 0.4} Q ${cx - eyeOffset} ${eyeY - eyeSize * 0.8} ${cx - eyeOffset + eyeSize * 0.3} ${eyeY - eyeSize * 0.3}`} stroke={strokeColor} strokeWidth={sw * 0.8} fill="none" strokeLinecap={cap} />
            <circle cx={cx - eyeOffset - eyeSize * 0.45} cy={eyeY} r={eyeSize * 0.65} fill={strokeColor} />
          </>
        ) : eyeCfg.left === 'calm-curve' ? (
          <path d={`M ${cx - eyeOffset - eyeSize} ${eyeY} Q ${cx - eyeOffset} ${eyeY - eyeSize * 0.6} ${cx - eyeOffset + eyeSize * 0.3} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap={cap} />
        ) : null}

        {/* 右眼 */}
        {eyeCfg.right === 'circle' ? (
          <circle cx={cx + eyeOffset} cy={eyeY} r={eyeSize} fill={strokeColor} />
        ) : eyeCfg.right === 'arc' ? (
          <path d={`M ${cx + eyeOffset - eyeSize} ${eyeY + eyeSize * 0.5} Q ${cx + eyeOffset} ${eyeY - eyeSize * 0.3} ${cx + eyeOffset + eyeSize} ${eyeY + eyeSize * 0.5}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap={cap} />
        ) : eyeCfg.right === 'dot' ? (
          <circle cx={cx + eyeOffset} cy={eyeY} r={eyeSize * 0.7} fill={strokeColor} />
        ) : eyeCfg.right === 'cry-eye' ? (
          <>
            <circle cx={cx + eyeOffset} cy={eyeY} r={eyeSize * 0.9} fill={strokeColor} />
            <ellipse cx={cx + eyeOffset + eyeSize * 0.6} cy={eyeY + eyeSize * 1.4} rx={eyeSize * 0.35} ry={eyeSize * 0.6} fill="#ADD8E6" opacity={0.6} />
          </>
        ) : eyeCfg.right === 'worried-brow' ? (
          <>
            <path d={`M ${cx + eyeOffset - eyeSize * 0.3} ${eyeY - eyeSize * 0.3} Q ${cx + eyeOffset} ${eyeY - eyeSize * 0.8} ${cx + eyeOffset + eyeSize * 1.2} ${eyeY - eyeSize * 0.4}`} stroke={strokeColor} strokeWidth={sw * 0.8} fill="none" strokeLinecap={cap} />
            <circle cx={cx + eyeOffset + eyeSize * 0.45} cy={eyeY} r={eyeSize * 0.65} fill={strokeColor} />
          </>
        ) : eyeCfg.right === 'calm-curve' ? (
          <path d={`M ${cx + eyeOffset - eyeSize * 0.3} ${eyeY} Q ${cx + eyeOffset} ${eyeY - eyeSize * 0.6} ${cx + eyeOffset + eyeSize} ${eyeY}`} stroke={strokeColor} strokeWidth={sw} fill="none" strokeLinecap={cap} />
        ) : null}

        {/* 嘴巴 */}
        <path d={mouthPath} stroke={strokeColor} strokeWidth={sw + 0.3} fill="none" strokeLinecap={cap} />

        {/* 腮红（warm / shy） */}
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
   * 渲染单个果实（带 hover 交互）
   */
  const renderFruit = (fruit: typeof renderFruits[number], i: number) => {
    const r = s.fruitR * fruit.scale
    const { cx, cy, color } = fruit
    const gradId = `ef-grad-${size}-${i}-${color.replace('#', '')}`
    const isHovered = hoveredIndex === i
    const hasMeta = fruit.meta !== null

    return (
      <g key={i}>
        <defs>
          <radialGradient id={gradId} cx="32%" cy="28%" r="58%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="35%" stopColor={color} stopOpacity="0.88" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Hover 时的光晕效果 */}
        {isHovered && hasMeta && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 6}
            fill={color}
            opacity={0.15}
            className="animate-glow-pulse"
          />
        )}

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
          style={{
            animationDelay: `${i * 0.12}s`,
            transformOrigin: `${cx}px ${cy}px`,
            cursor: hasMeta ? 'pointer' : 'default',
          }}
          onMouseEnter={() => hasMeta && setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
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

  /** 当前悬停果实的元数据 */
  const hoveredFruit = hoveredIndex !== null ? renderFruits[hoveredIndex]?.meta : null

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={s.width}
        height={s.height}
        viewBox="0 0 300 280"
        className={animClass}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`情绪果实树 — ${renderFruits.length} 颗果实`}
      >
        <defs>
          <linearGradient id={`et-trunk-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B88A5E" />
            <stop offset="50%" stopColor="#A67C52" />
            <stop offset="100%" stopColor="#8B6240" />
          </linearGradient>
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
          <path d="M152 260 Q146 205 150 158 Q152 128 157 102" stroke="#8B6240" strokeWidth={s.strokeWidth + 2} fill="none" />
          <path d="M152 260 Q146 205 150 158 Q152 128 157 102" stroke={`url(#et-trunk-${size})`} strokeWidth={s.strokeWidth} fill="none" />
          <path d="M152 178 Q125 158 95 138 Q70 122 52 105" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.72} fill="none" />
          <path d="M152 165 Q178 145 208 125 Q232 108 255 98" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.72} fill="none" />
          <path d="M152 145 Q134 122 115 96 Q100 75 90 60" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.56} fill="none" />
          <path d="M152 138 Q170 115 192 88 Q208 68 222 55" stroke="#A67C52" strokeWidth={s.strokeWidth * 0.56} fill="none" />
          <path d="M95 138 Q78 128 62 138 Q48 148 40 162" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.42} fill="none" />
          <path d="M208 125 Q225 136 242 148 Q255 158 252 175" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.42} fill="none" />
          <path d="M115 96 Q100 84 85 72" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.32} fill="none" />
          <path d="M192 88 Q210 76 228 68" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.32} fill="none" />
          <path d="M52 105 Q42 94 32 86" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.24} fill="none" />
          <path d="M255 98 Q268 90 280 84" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.24} fill="none" />
          <path d="M150 195 Q172 206 194 214" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
          <path d="M150 202 Q130 214 112 225" stroke="#B88A5E" strokeWidth={s.strokeWidth * 0.3} fill="none" />
          <path d="M62 138 Q50 150 38 162" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.22} fill="none" />
          <path d="M242 148 Q256 158 270 168" stroke="#C49A72" strokeWidth={s.strokeWidth * 0.22} fill="none" />
        </g>

        {/* ===== 情绪果实 ===== */}
        {renderFruits.map(renderFruit)}
      </svg>

      {/* ===== 悬停 Tooltip 弹窗 ===== */}
      {hoveredFruit && (
        <div
          className="absolute z-50 max-w-[240px] rounded-2xl border border-milkBrown/10 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm animate-fade-in"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
          }}
        >
          {/* 标题行：小果实图标 + 对话标题 */}
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="h-4 w-4 flex-shrink-0 rounded-full"
              style={{ backgroundColor: hoveredFruit.emotionColor }}
            />
            <span className="truncate text-xs font-semibold text-milkBrown">
              {hoveredFruit.title}
            </span>
          </div>

          {/* 300 字总结内容 */}
          <p className="text-[11px] leading-relaxed text-milkBrown/75">
            {hoveredFruit.summary300}
          </p>

          {/* 底部元信息 */}
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-hint">
            <span>{new Date(hoveredFruit.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
            <span>·</span>
            <span>{hoveredFruit.messageCount} 条消息</span>
          </div>

          {/* 小三角箭头 */}
          <div
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/95 border-r border-b border-milkBrown/10"
          />
        </div>
      )}
    </div>
  )
}

export default EmotionTree
