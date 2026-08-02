import React from 'react'
import type { BlindspotStage } from '@/types'

/**
 * BlindspotPlant — 盲点花园里的单株植物（SVG 手绘风）
 *
 * 三个生长阶段（不展示任何数字，只呈现生命感）：
 *  - seed：   土壤里的一颗小种子
 *  - sprout： 冒出嫩芽（茎 + 两片小叶）
 *  - mature： 开花的成熟植物（按植物名 hash 分配花型与配色）
 *
 * 成熟花型变体：bell（铃兰系）/ puff（蒲公英系）/ daisy（雏菊系）
 *             / spike（薰衣草系）/ leaf（薄荷系）
 */

interface BlindspotPlantProps {
  stage: BlindspotStage
  /** 成熟植物名（用于决定花型与配色；未成熟可空） */
  plantName?: string
  className?: string
}

type FlowerVariant = 'bell' | 'puff' | 'daisy' | 'spike' | 'leaf'

/** 植物名 → 花型 */
function variantOf(name?: string): FlowerVariant {
  if (!name) return 'daisy'
  if (/铃兰|风信子|雪滴花/.test(name)) return 'bell'
  if (/蒲公英|满天星|酢浆草/.test(name)) return 'puff'
  if (/薰衣草|婆婆纳|鸢尾/.test(name)) return 'spike'
  if (/薄荷|迷迭香|含羞草/.test(name)) return 'leaf'
  return 'daisy' // 雏菊、木槿等默认
}

/** 植物名 → 主色（hash 稳定分配马卡龙色） */
function colorOf(name?: string): string {
  const palette = ['#FFB6C1', '#FFB347', '#DDA0DD', '#ADD8E6', '#F0E68C', '#FFC8C8']
  if (!name) return palette[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return palette[Math.abs(h) % palette.length]
}

const BlindspotPlant: React.FC<BlindspotPlantProps> = ({ stage, plantName, className = '' }) => {
  const variant = variantOf(plantName)
  const color = colorOf(plantName)

  return (
    <svg
      viewBox="0 0 100 110"
      className={className}
      role="img"
      aria-label={stage === 'mature' && plantName ? `成熟植物：${plantName}` : stage === 'sprout' ? '发芽的种子' : '一颗种子'}
    >
      {/* ===== 土壤（所有阶段共有） ===== */}
      <ellipse cx="50" cy="98" rx="32" ry="8" fill="#C9A26B" opacity="0.65" />
      <path d="M22 96 Q50 91 78 96 L76 102 Q50 106 24 102 Z" fill="#9C7B4A" opacity="0.5" />

      {/* ===== 种子阶段 ===== */}
      {stage === 'seed' && (
        <g>
          <ellipse cx="50" cy="91" rx="6" ry="4.5" fill="#7FA176" />
          <path d="M50 87 Q52 82 48 80" fill="none" stroke="#A8C5A0" strokeWidth="1.8" strokeLinecap="round" />
          {/* 微小的等待感：旁边一点土粒 */}
          <circle cx="38" cy="94" r="1.2" fill="#9C7B4A" opacity="0.6" />
          <circle cx="63" cy="93" r="1" fill="#9C7B4A" opacity="0.5" />
        </g>
      )}

      {/* ===== 发芽阶段 ===== */}
      {stage === 'sprout' && (
        <g>
          <path d="M50 95 L50 68" stroke="#7FA176" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M50 80 C41 76 39 67 46 63 C50 68 50 76 50 80Z" fill="#A8C5A0" />
          <path d="M50 73 C59 69 61 60 54 56 C50 61 50 69 50 73Z" fill="#A8C5A0" />
          {/* 一点晨露 */}
          <circle cx="43" cy="66" r="1.3" fill="#ADD8E6" opacity="0.7" />
        </g>
      )}

      {/* ===== 成熟阶段 ===== */}
      {stage === 'mature' && (
        <g>
          {/* 茎 + 叶 */}
          <path d="M50 95 L50 48" stroke="#7FA176" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M50 82 C40 78 38 69 46 65 C50 70 50 78 50 82Z" fill="#A8C5A0" />
          <path d="M50 70 C60 66 62 57 54 53 C50 58 50 66 50 70Z" fill="#A8C5A0" />

          {/* bell：铃兰系（下垂小铃铛） */}
          {variant === 'bell' && (
            <g>
              {[-14, 0, 14].map((dx, i) => (
                <g key={i}>
                  <path d={`M50 48 Q${50 + dx * 0.7} ${40 - i * 2} ${50 + dx} 38`} fill="none" stroke="#7FA176" strokeWidth="1.6" />
                  <path
                    d={`M${50 + dx - 5} 38 Q${50 + dx} 32 ${50 + dx + 5} 38 L${50 + dx + 3.5} 44 Q${50 + dx} 46.5 ${50 + dx - 3.5} 44 Z`}
                    fill={color}
                    opacity="0.9"
                  />
                </g>
              ))}
            </g>
          )}

          {/* puff：蒲公英系（绒球） */}
          {variant === 'puff' && (
            <g transform="translate(50 38)">
              <circle r="11" fill={color} opacity="0.28" />
              <circle r="8" fill={color} opacity="0.4" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * 3}
                    y1={Math.sin(a) * 3}
                    x2={Math.cos(a) * 11}
                    y2={Math.sin(a) * 11}
                    stroke={color}
                    strokeWidth="1.1"
                    opacity="0.85"
                  />
                )
              })}
              <circle r="3" fill="#FFFDF4" opacity="0.9" />
            </g>
          )}

          {/* daisy：雏菊系（五瓣花） */}
          {variant === 'daisy' && (
            <g transform="translate(50 40)">
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse key={deg} cx={0} cy={-8.5} rx={4.5} ry={7} fill={color} opacity="0.9" transform={`rotate(${deg})`} />
              ))}
              <circle r={4} fill="#FFD699" />
            </g>
          )}

          {/* spike：薰衣草系（穗状） */}
          {variant === 'spike' && (
            <g>
              {Array.from({ length: 6 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={50 + (i % 2 === 0 ? -2 : 2)}
                  cy={44 - i * 4.5}
                  rx={4.2 - i * 0.35}
                  ry={3.4 - i * 0.25}
                  fill={color}
                  opacity={0.85 - i * 0.05}
                />
              ))}
            </g>
          )}

          {/* leaf：薄荷系（丛生叶） */}
          {variant === 'leaf' && (
            <g>
              {[-16, -8, 0, 8, 16].map((dx, i) => (
                <path
                  key={i}
                  d={`M50 52 Q${50 + dx * 0.8} ${44 - Math.abs(dx) * 0.4} ${50 + dx} ${34 - (i % 2) * 4} Q${50 + dx * 0.6} ${42 - Math.abs(dx) * 0.3} 50 52Z`}
                  fill={i % 2 === 0 ? '#A8C5A0' : color}
                  opacity="0.9"
                />
              ))}
            </g>
          )}

          {/* 成熟的光点装饰 */}
          <circle cx="30" cy="36" r="1.4" fill="#FFD699" opacity="0.8" />
          <circle cx="72" cy="46" r="1.1" fill="#FFD699" opacity="0.7" />
        </g>
      )}
    </svg>
  )
}

export default BlindspotPlant
