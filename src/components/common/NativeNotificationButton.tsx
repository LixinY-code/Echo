import { useState } from 'react'
import { isNativeAndroid, enablePushNotifications } from '@/services/native'
import { useLang } from '@/i18n'

type State = 'idle' | 'loading' | 'enabled' | 'error'

export default function NativeNotificationButton() {
  const { lang } = useLang()
  const [state, setState] = useState<State>('idle')

  if (!isNativeAndroid()) return null

  const label = state === 'enabled'
    ? (lang === 'zh' ? '通知已开启' : 'Notifications enabled')
    : (lang === 'zh' ? '开启温柔提醒' : 'Enable gentle reminders')

  const handleClick = async () => {
    if (state === 'loading' || state === 'enabled') return
    setState('loading')
    const result = await enablePushNotifications()
    setState(result.enabled ? 'enabled' : 'error')
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={label}
      title={state === 'error'
        ? (lang === 'zh' ? '通知暂不可用，请检查系统权限或 Firebase 配置' : 'Notifications unavailable; check permission or Firebase setup')
        : label}
      className={[
        'interactive-hover flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300',
        state === 'enabled' ? 'bg-sage/25 text-sage' : 'text-ink/45 hover:bg-apricot/30 hover:text-milkBrown',
        state === 'loading' ? 'animate-pulse' : '',
        state === 'error' ? 'text-amber' : '',
      ].join(' ')}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7.5 10.2c0-3 1.7-5.1 4.5-5.1s4.5 2.1 4.5 5.1c0 3.4 1.3 4.7 2.1 5.8H5.4c.8-1.1 2.1-2.4 2.1-5.8Z" />
        <path d="M10 18.2c.4.8 1 1.2 2 1.2s1.6-.4 2-1.2" />
        <path d="M12 3.2v1.1" />
        {state === 'enabled' && <path d="m16.6 6.3 1.1 1.1 2.1-2.3" />}
      </svg>
    </button>
  )
}
