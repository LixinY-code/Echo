/**
 * WelcomePage — 欢迎页 / 情境化开场（Echo v2.0）
 * - 根据客户端时间显示不同问候语
 * - 背景为 CSS 手绘的台灯照亮小书桌
 * - 中央两个柔和大按钮：开始对话 / 写写日记
 * - v2.0: 使用 EchoLogo 品牌组件 + 新色彩 token
 */
import { Link } from 'react-router-dom'
import { greetingByTime, timeLabel } from '@/utils/time'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import EchoLogo from '@/components/common/EchoLogo' // v2.0 新增
import GlimmerNote from '@/components/common/GlimmerNote' // 微光任务小纸条

export default function WelcomePage() {
  const greeting = greetingByTime()
  const label = timeLabel()

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      {/* ===== 背景手绘小书桌场景 ===== */}
      <DeskScene label={label} />

      {/* ===== 暗角与暖光（v2.0 更新色调） ===== */}
      <div className="pointer-events-none absolute inset-0 lamp-glow" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 110%, transparent 40%, rgba(166,124,82,0.06) 100%)',
        }}
      />

      {/* ===== 主体内容 ===== */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* v2.0: Echo 品牌Logo（替代原来的 mirror 图标） */}
        <div className="mb-8 animate-fade-in">
          <EchoLogo size="lg" showText={true} animated={false} className="mx-auto h-32 w-auto" />
        </div>

        {/* 墙上的字条（胶带粘贴，手写体问候） */}
        <div
          className="relative w-full max-w-md animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {/* 胶带 — 左上 */}
          <div
            className="absolute -top-3 left-8 z-10 h-7 w-20 -rotate-[8deg] bg-[#F2DCB0]/70 shadow-[0_1px_2px_rgba(166,124,82,0.2)]"
            style={{
              clipPath:
                'polygon(3% 0, 97% 0, 100% 15%, 98% 100%, 2% 100%, 0 15%)',
            }}
          />
          {/* 胶带 — 右上 */}
          <div
            className="absolute -top-3 right-8 z-10 h-7 w-20 rotate-[7deg] bg-[#F2DCB0]/70 shadow-[0_1px_2px_rgba(166,124,82,0.2)]"
            style={{
              clipPath:
                'polygon(3% 0, 97% 0, 100% 15%, 98% 100%, 2% 100%, 0 15%)',
            }}
          />
          {/* 字条纸（微倾斜 + 横线纸纹 + 柔和投影） */}
          <div
            className="rotate-[-1.5deg] rounded-[3px] bg-[#FFFDF4] px-8 py-7 ring-1 ring-milkBrown/5 shadow-[0_12px_32px_-10px_rgba(166,124,82,0.35)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(transparent, transparent 31px, rgba(166,124,82,0.09) 32px)',
            }}
          >
            <p className="text-balance font-hand text-3xl leading-snug text-milkBrown sm:text-4xl">
              {greeting}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-hint">
              深夜里的一盏小台灯。
              <br />
              在这里，AI 会陪你说话，也会让你看见它如何说话。
            </p>
          </div>
        </div>

        {/* v2.0 两个大按钮（使用新色彩 token） */}
        <div
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-5 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <Link
            to="/chat"
            className="group interactive-hover inline-flex items-center justify-center gap-2.5 rounded-3xl bg-apricot px-9 py-4 text-lg font-bold text-milkBrown shadow-soft transition-all duration-300 ease-soft hover:shadow-glow"
          >
            <HandDrawnIcon name="paper-plane" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            开始对话
          </Link>
          <Link
            to="/journal"
            className="group interactive-hover inline-flex items-center justify-center gap-2.5 rounded-3xl bg-paper border border-milkBrown/10 px-9 py-4 text-lg font-bold text-milkBrown/70 shadow-soft transition-all duration-300 ease-soft hover:text-milkBrown hover:shadow-soft-md"
          >
            <HandDrawnIcon name="journal" className="h-5 w-5" />
            写写日记
          </Link>
        </div>

        {/* 底部小字（v2.0 使用 hint 色） */}
        <p
          className="mt-14 text-xs text-hint animate-fade-in"
          style={{ animationDelay: '0.7s' }}
        >
          这里没有评判，只有一盏亮着的小灯。
        </p>
      </div>

      {/* ===== 微光任务小纸条（右下角，可展开） ===== */}
      <GlimmerNote />
    </div>
  )
}

/* ============ 背景小书桌场景（v2.0 更新色调） ============ */
function DeskScene({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
      <svg
        viewBox="0 0 800 400"
        className="h-full w-full max-w-4xl opacity-70"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
      >
        {/* v2.0 暖光晕（使用新 amber 色） */}
        <defs>
          <radialGradient id="halo" cx="50%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#FFD4A3" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFD4A3" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5E6D3" /> {/* v2.0 apricot */}
            <stop offset="100%" stopColor="#E8D4B8" />
          </linearGradient>
        </defs>
        <ellipse cx="400" cy="160" rx="260" ry="140" fill="url(#halo)" />

        {/* 桌面 */}
        <path d="M60 320 L740 320 L780 400 L20 400 Z" fill="url(#desk)" opacity="0.7" />

        {/* 台灯（v2.0 使用新 amber，下移 24px 落在桌面上） */}
        <g transform="translate(0 24)">
          <path
            d="M360 120 Q400 100 440 120 L430 175 Q400 185 370 175 Z"
            fill="#F2B880" /* v2.0 amber */
            opacity="0.9"
          />
          <path d="M400 175 L400 280" stroke="#A67C52" strokeWidth="4" strokeLinecap="round" /> {/* v2.0 milkBrown */}
          <path d="M375 282 Q400 276 425 282 L420 292 Q400 296 380 292 Z" fill="#A67C52" />
          <path
            d="M370 175 L300 300 M430 175 L500 300"
            stroke="#FFD4A3" /* v2.0 amber-light */
            strokeWidth="2"
            opacity="0.4"
          />
        </g>

        {/* 摊开的书（v2.0 paper 色） */}
        <g opacity="0.8">
          <path d="M470 290 L630 290 L640 320 L460 320 Z" fill="#FFFBF5" />
          <path d="M550 290 L550 320" stroke="#E8D4B8" strokeWidth="2" />
          <path d="M485 300 L540 300 M485 308 L535 308 M560 300 L625 300 M560 308 L620 308" stroke="#E8D4B8" strokeWidth="1.5" />
        </g>

        {/* 茶杯（v2.0 paper + milkBrown，下移 6px 落在桌面上） */}
        <g opacity="0.85" transform="translate(0 6)">
          <path d="M210 285 Q230 283 250 285 L248 310 Q230 314 212 310 Z" fill="#FFFBF5" stroke="#A67C52" strokeWidth="2" />
          <path d="M250 290 Q262 290 262 300 Q262 308 250 308" fill="none" stroke="#A67C52" strokeWidth="2" />
          {/* 热气（使用 sage 绿色保持不变） */}
          <path d="M222 280 Q218 270 224 262 Q230 254 226 244" fill="none" stroke="#98FB98" strokeWidth="2" opacity="0.5" />
          <path d="M236 280 Q240 270 234 262 Q228 254 234 244" fill="none" stroke="#98FB98" strokeWidth="2" opacity="0.5" />
        </g>

        {/* 时段小装饰（v2.0 更新颜色） */}
        {label === 'lateNight' && (
          <g>
            <circle cx="120" cy="80" r="22" fill="#FFF9EF" opacity="0.9" />
            <circle cx="112" cy="78" r="20" fill="#FFF9EF" />
            <circle cx="140" cy="75" r="1.5" fill="#F2B880" />
            <circle cx="160" cy="110" r="1" fill="#F2B880" />
            <circle cx="95" cy="120" r="1.2" fill="#F2B880" />
          </g>
        )}
        {label === 'morning' && (
          <g>
            <circle cx="680" cy="90" r="26" fill="#F2B880" opacity="0.8" />
            <circle cx="680" cy="90" r="36" fill="#FFD4A3" opacity="0.3" />
          </g>
        )}
      </svg>
    </div>
  )
}
