import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initializeNativeShell } from '@/services/native'

export default function NativeBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    let cleanup: (() => void) | undefined
    void initializeNativeShell((path) => navigate(path)).then((dispose) => {
      cleanup = dispose
    })

    return () => cleanup?.()
  }, [navigate])

  return null
}
