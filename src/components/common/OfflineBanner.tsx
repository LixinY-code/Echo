import { useNetwork } from '@/context/NetworkContext'
import { useLang } from '@/i18n'

export default function OfflineBanner() {
  const { online } = useNetwork()
  const { lang } = useLang()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 z-[100] mx-auto max-w-md rounded-2xl border border-milkBrown/10 bg-paper/95 px-4 py-2.5 text-center text-xs font-semibold text-milkBrown shadow-soft backdrop-blur-md"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
    >
      {lang === 'zh'
        ? '当前处于离线状态，已保存的页面与本地内容仍可查看。'
        : 'You are offline. Saved pages and local content remain available.'}
    </div>
  )
}
