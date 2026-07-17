/**
 * WelcomePage — 欢迎页 / 情境化开场
 * - 根据客户端时间显示不同问候语
 * - 背景为 CSS 手绘的台灯照亮小书桌
 * - 中央两个柔和大按钮：开始对话 / 写写日记
 * - 按钮悬停轻微放大 + 柔光
 */
import { Link } from 'react-router-dom'
import { greetingByTime, timeLabel } from '@/utils/time'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'

export default function WelcomePage() {
  const greeting = greetingByTime()
  const label = timeLabel()

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      {/* ===== 背景手绘小书桌场景 ===== */}
      <DeskScene label={label} />

      {/* ===== 暗角与暖光 ===== */}
      <div className="pointer-events-none absolute inset-0 lamp-glow" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 110%, transparent 40%, rgba(74,63,53,0.08) 100%)',
        }}
      />

      {/* ===== 主体内容 ===== */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* 小标识 */}
        <div className="mb-8 flex items-center gap-2 text-amber animate-fade-in">
          <HandDrawnIcon name="mirror" className="h-7 w-7" />
          <span className="text-2xl font-extrabold tracking-wide text-ink">Echo</span>
        </div>

        {/* 问候语 */}
        <p
          className="max-w-md text-balance font-hand text-3xl leading-snug text-ink/85 sm:text-4xl animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          {greeting}
        </p>

        {/* 副标题 */}
        <p
          className="mt-5 max-w-sm text-sm leading-relaxed text-ink/55 animate-fade-in-up"
          style={{ animationDelay: '0.25s' }}
        >
          深夜里的一盏小台灯。
          <br />
          在这里，AI 会陪你说话，也会让你看见它如何说话。
        </p>

        {/* 两个大按钮 */}
        <div
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-5 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <Link
            to="/chat"
            className="group inline-flex items-center justify-center gap-2.5 rounded-3xl bg-apricot px-9 py-4 text-lg font-bold text-ink shadow-soft transition-all duration-300 ease-soft hover:scale-[1.03] hover:bg-apricot-light hover:shadow-glow"
          >
            <HandDrawnIcon name="paper-plane" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            开始对话
          </Link>
          <Link
            to="/journal"
            className="group inline-flex items-center justify-center gap-2.5 rounded-3xl bg-cream-50 border border-ink/10 px-9 py-4 text-lg font-bold text-ink/75 shadow-soft transition-all duration-300 ease-soft hover:scale-[1.03] hover:text-ink hover:shadow-soft-md"
          >
            <HandDrawnIcon name="journal" className="h-5 w-5" />
            写写日记
          </Link>
        </div>

        {/* 底部小字 */}
        <p
          className="mt-14 text-xs text-ink/35 animate-fade-in"
          style={{ animationDelay: '0.7s' }}
        >
          这里没有评判，只有一盏亮着的小灯。
        </p>
      </div>
    </div>
  )
}

/* ============ 背景小书桌场景（纯 CSS / SVG） ============ */
function DeskScene({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
      <svg
        viewBox="0 0 800 400"
        className="h-full w-full max-w-4xl opacity-70"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
      >
        {/* 暖光晕 */}
        <defs>
          <radialGradient id="halo" cx="50%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#FFD699" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFD699" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8C9A0" />
            <stop offset="100%" stopColor="#D9B486" />
          </linearGradient>
        </defs>
        <ellipse cx="400" cy="160" rx="260" ry="140" fill="url(#halo)" />

        {/* 桌面 */}
        <path d="M60 320 L740 320 L780 400 L20 400 Z" fill="url(#desk)" opacity="0.7" />

        {/* 台灯 */}
        <g>
          {/* 灯罩 */}
          <path
            d="M360 120 Q400 100 440 120 L430 175 Q400 185 370 175 Z"
            fill="#FFB347"
            opacity="0.9"
          />
          {/* 灯杆 */}
          <path d="M400 175 L400 280" stroke="#4A3F35" strokeWidth="4" strokeLinecap="round" />
          {/* 灯座 */}
          <path d="M375 282 Q400 276 425 282 L420 292 Q400 296 380 292 Z" fill="#4A3F35" />
          {/* 光线 */}
          <path
            d="M370 175 L300 300 M430 175 L500 300"
            stroke="#FFD699"
            strokeWidth="2"
            opacity="0.4"
          />
        </g>

        {/* 摊开的书 */}
        <g opacity="0.8">
          <path d="M470 290 L630 290 L640 320 L460 320 Z" fill="#FBF4E6" />
          <path d="M550 290 L550 320" stroke="#E0D2B8" strokeWidth="2" />
          <path d="M485 300 L540 300 M485 308 L535 308 M560 300 L625 300 M560 308 L620 308" stroke="#BFAE91" strokeWidth="1.5" />
        </g>

        {/* 茶杯 */}
        <g opacity="0.85">
          <path d="M210 285 Q230 283 250 285 L248 310 Q230 314 212 310 Z" fill="#FFF8F0" stroke="#4A3F35" strokeWidth="2" />
          <path d="M250 290 Q262 290 262 300 Q262 308 250 308" fill="none" stroke="#4A3F35" strokeWidth="2" />
          {/* 热气 */}
          <path d="M222 280 Q218 270 224 262 Q230 254 226 244" fill="none" stroke="#A8C5A0" strokeWidth="2" opacity="0.5" />
          <path d="M236 280 Q240 270 234 262 Q228 254 234 244" fill="none" stroke="#A8C5A0" strokeWidth="2" opacity="0.5" />
        </g>

        {/* 时段小装饰 */}
        {label === 'lateNight' && (
          <g>
            <circle cx="120" cy="80" r="22" fill="#FFF8F0" opacity="0.9" />
            <circle cx="112" cy="78" r="20" fill="#FFF8F0" />
            <circle cx="140" cy="75" r="1.5" fill="#FFD699" />
            <circle cx="160" cy="110" r="1" fill="#FFD699" />
            <circle cx="95" cy="120" r="1.2" fill="#FFD699" />
          </g>
        )}
        {label === 'morning' && (
          <g>
            <circle cx="680" cy="90" r="26" fill="#FFB347" opacity="0.8" />
            <circle cx="680" cy="90" r="36" fill="#FFD699" opacity="0.3" />
          </g>
        )}
      </svg>
    </div>
  )
}
