import React from 'react'

/**
 * Garden — 手绘小花园（生长花组件）
 *
 * 根据完成的任务数量显示不同的生长阶段：
 *  - seed（0 件）：一颗种子
 *  - sprout（1-2 件）：冒出嫩芽
 *  - leaf（3-4 件）：长出叶子
 *  - flower（5+ 件）：悄悄开花了
 *
 * 从 v2.0 前版本恢复，用于 CornerPage 的成长可视化
 */
interface GardenProps {
  /** 已完成的任务数量 */
  questCount: number
  /** 尺寸规格 */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

type GardenStage = 'seed' | 'sprout' | 'leaf' | 'flower'

/** 根据任务数判断生长阶段 */
function getStage(count: number): GardenStage {
  if (count <= 0) return 'seed'
  if (count <= 2) return 'sprout'
  if (count <= 4) return 'leaf'
  return 'flower'
}

/** 阶段文案映射 */
const STAGE_LABELS: Record<GardenStage, { label: string; hint: string }> = {
  seed: { label: '一颗种子', hint: '一切才刚刚开始' },
  sprout: { label: '冒出了嫩芽', hint: '你已经迈出了第一步' },
  leaf: { label: '长出了叶子', hint: '正在悄悄扎根' },
  flower: { label: '悄悄开花了', hint: '这些小小的坚持，会变成光' },
}

const Garden: React.FC<GardenProps> = ({
  questCount = 0,
  size = 'md',
  className = '',
}) => {
  const stage = getStage(questCount)
  const { label } = STAGE_LABELS[stage]

  // 尺寸规格
  const sizes = {
    sm: { width: 120, height: 105, className: 'h-24 w-28' },
    md: { width: 160, height: 140, className: 'h-36 w-44' },
    lg: { width: 200, height: 175, className: 'h-44 w-56' },
  }

  const s = sizes[size]

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* SVG 花园插图 */}
      <svg
        viewBox="0 0 160 140"
        className={s.className}
        aria-label={`花园 — ${label}`}
        role="img"
      >
        {/* ===== 土壤 ===== */}
        <ellipse cx="80" cy="120" rx="55" ry="12" fill="#C9A26B" opacity={0.7} />
        <path
          d="M30 118 Q80 112 130 118 L128 126 Q80 132 32 126 Z"
          fill="#9C7B4A"
          opacity={0.6}
        />

        {/* ===== 阶段 1：种子 ===== */}
        {stage === 'seed' && (
          <g>
            {/* 种子 */}
            <ellipse cx="80" cy="112" rx="7" ry="5" fill="#7FA176" />
            <path
              d="M80 107 Q82 102 78 99"
              fill="none"
              stroke="#A8C5A0"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ===== 阶段 2：嫩芽 ===== */}
        {stage === 'sprout' && (
          <g>
            {/* 茎 */}
            <path
              d="M80 116 L80 90"
              stroke="#7FA176"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* 两片小叶子 */}
            <path
              d="M80 100 C72 96 70 88 76 84 C80 88 80 96 80 100Z"
              fill="#A8C5A0"
            />
            <path
              d="M80 95 C88 91 90 84 84 80 C80 84 80 91 80 95Z"
              fill="#A8C5A0"
            />
          </g>
        )}

        {/* ===== 阶段 3：长叶 ===== */}
        {stage === 'leaf' && (
          <g>
            {/* 茎 */}
            <path
              d="M80 116 L80 70"
              stroke="#7FA176"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* 三片大叶子 */}
            <path
              d="M80 100 C66 94 62 82 72 76 C78 84 80 94 80 100Z"
              fill="#A8C5A0"
            />
            <path
              d="M80 88 C94 82 98 70 88 64 C82 72 80 82 80 88Z"
              fill="#A8C5A0"
            />
            <path
              d="M80 75 C70 71 66 62 74 58 C78 64 80 71 80 75Z"
              fill="#CFE0C9"
            />
          </g>
        )}

        {/* ===== 阶段 4：开花 ===== */}
        {stage === 'flower' && (
          <g>
            {/* 茎 + 叶子 */}
            <path
              d="M80 116 L80 55"
              stroke="#7FA176"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <path
              d="M80 98 C66 92 62 80 72 74 C78 82 80 92 80 98Z"
              fill="#A8C5A0"
            />
            <path
              d="M80 82 C94 76 98 64 88 58 C82 66 80 76 80 82Z"
              fill="#A8C5A0"
            />

            {/* 五瓣花 */}
            <g transform="translate(80 50)">
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                  key={deg}
                  cx={0}
                  cy="-11"
                  rx={6}
                  ry={9}
                  fill="#FFB347"
                  opacity={0.9}
                  transform={`rotate(${deg})`}
                />
              ))}
              {/* 花心 */}
              <circle cx={0} cy={0} r={5} fill="#FFD699" />
            </g>

            {/* 光点装饰 */}
            <circle cx={50} cy={40} r={1.5} fill="#FFD699" opacity={0.8} />
            <circle cx={115} cy={55} r={1.2} fill="#FFD699" opacity={0.7} />
            <circle cx={40} cy={70} r={1} fill="#FFD699" opacity={0.6} />
          </g>
        )}

        {/* ===== 太阳/月光 ===== */}
        <circle cx={130} cy={28} r={10} fill="#FFD699" opacity={0.5} />
        <circle cx={130} cy={28} r={6} fill="#FFB347" opacity={0.6} />
      </svg>

      {/* 阶段文字（可选显示） */}
      <p className="mt-1 text-center text-xs font-medium text-hint">{label}</p>
    </div>
  )
}

export default Garden
