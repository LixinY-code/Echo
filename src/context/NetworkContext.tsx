import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { Network, type ConnectionStatus } from '@capacitor/network'

interface NetworkState {
  online: boolean
  connectionType: ConnectionStatus['connectionType'] | 'unknown'
}

const NetworkContext = createContext<NetworkState>({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  connectionType: 'unknown',
})

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkState>({
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    connectionType: 'unknown',
  })

  useEffect(() => {
    let cancelled = false
    let removeNativeListener: (() => Promise<void>) | undefined

    const update = (status: ConnectionStatus) => {
      if (!cancelled) {
        setState({ online: status.connected, connectionType: status.connectionType })
      }
    }

    if (Capacitor.isNativePlatform()) {
      void Network.getStatus().then(update).catch(() => undefined)
      void Network.addListener('networkStatusChange', update).then((handle) => {
        removeNativeListener = () => handle.remove()
      })
    } else {
      const onOnline = () => setState((current) => ({ ...current, online: true }))
      const onOffline = () => setState((current) => ({ ...current, online: false }))
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
      removeNativeListener = async () => {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('offline', onOffline)
      }
    }

    return () => {
      cancelled = true
      void removeNativeListener?.()
    }
  }, [])

  const value = useMemo(() => state, [state])
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  return useContext(NetworkContext)
}
