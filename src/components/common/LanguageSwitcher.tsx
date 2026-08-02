/**
 * LanguageSwitcher — 中英文切换按钮（右上角）
 *
 * 风格与导航栏图标一致：h-10 圆角胶囊 + 手绘地球图标。
 * 显示目标语言（中文界面显示 "EN"，英文界面显示 "中"）。
 */
import { useLang } from '@/i18n'

interface Props {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: Props) {
  const { lang, setLang, t } = useLang()
  const isZh = lang === 'zh'

  return (
    <button
      onClick={() => setLang(isZh ? 'en' : 'zh')}
      aria-label={t('lang.switch')}
      title={t('lang.switch')}
      className={`interactive-hover flex h-10 items-center gap-1.5 rounded-2xl px-2.5 text-ink/45 transition-all duration-300 ease-soft hover:bg-apricot/30 hover:text-milkBrown ${className}`}
    >
      {/* 手绘地球 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c-5 5.5-5 11.5 0 17" />
        <path d="M12 3.5c5 5.5 5 11.5 0 17" />
      </svg>
      <span className="text-xs font-bold tracking-wide">{isZh ? 'EN' : '中'}</span>
    </button>
  )
}
