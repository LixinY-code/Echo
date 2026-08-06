import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { PushNotifications } from '@capacitor/push-notifications'

const PUSH_TOKEN_KEY = 'echo_push_token'

export function isNativeAndroid() {
  return Capacitor.getPlatform() === 'android'
}

export async function initializeNativeShell(onNotificationRoute?: (path: string) => void) {
  if (!Capacitor.isNativePlatform()) return () => undefined

  const handles: Array<{ remove: () => Promise<void> }> = []

  const actionHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const target = event.notification.data?.path
    if (typeof target === 'string' && target.startsWith('/')) onNotificationRoute?.(target)
  })
  handles.push(actionHandle)

  const backHandle = await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.minimizeApp()
  })
  handles.push(backHandle)

  await SplashScreen.hide().catch(() => undefined)

  return () => {
    for (const handle of handles) void handle.remove()
  }
}

/**
 * 在明确的用户动作后调用，避免首次启动就弹通知权限。
 * 未配置 google-services.json 时注册会失败，但不会影响应用其他功能。
 */
export async function enablePushNotifications(): Promise<
  | { enabled: true; token?: string }
  | { enabled: false; reason: 'web' | 'denied' | 'unavailable' }
> {
  if (!isNativeAndroid()) return { enabled: false, reason: 'web' }

  try {
    let permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return { enabled: false, reason: 'denied' }

    await PushNotifications.createChannel({
      id: 'echo-gentle-reminders',
      name: 'Echo 温柔提醒',
      description: '微光任务与温柔陪伴提醒',
      importance: 3,
      visibility: 1,
      vibration: true,
    }).catch(() => undefined)

    const token = await new Promise<string | undefined>((resolve) => {
      let settled = false
      const finish = (value?: string) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      void PushNotifications.addListener('registration', ({ value }) => {
        try { localStorage.setItem(PUSH_TOKEN_KEY, value) } catch { /* ignore */ }
        finish(value)
      })
      void PushNotifications.addListener('registrationError', () => finish())
      void PushNotifications.register().catch(() => finish())
      window.setTimeout(() => finish(), 8000)
    })

    return token ? { enabled: true, token } : { enabled: false, reason: 'unavailable' }
  } catch {
    return { enabled: false, reason: 'unavailable' }
  }
}
