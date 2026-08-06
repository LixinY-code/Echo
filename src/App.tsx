/**
 * App — 路由根
 * 首次进入检测 onboarding：未完成则展示引导问卷，完成后进入正常路由。
 * 欢迎页 / 为沉浸式开场，不挂公共导航；其余内页共享 Layout。
 */
import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import WelcomePage from '@/pages/WelcomePage'
import ChatPage from '@/pages/ChatPage'
import JournalPage from '@/pages/JournalPage'
import InsightsPage from '@/pages/InsightsPage'
import CornerPage from '@/pages/CornerPage'
import BlindspotGardenPage from '@/pages/BlindspotGardenPage'
import Onboarding, { type OnboardingData } from '@/components/Onboarding'
import NativeBridge from '@/components/common/NativeBridge'
import OfflineBanner from '@/components/common/OfflineBanner'
import AppBootScreen from '@/components/common/AppBootScreen'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { isOnboarded, saveOnboarding } from '@/services/api'

export default function App() {
  const [onboarded, setOnboarded] = useState(isOnboarded())
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 520)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <NativeBridge />
      <OfflineBanner />
      {booting && <AppBootScreen />}

      <div className="fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.65rem,env(safe-area-inset-top))] z-[60] animate-fade-in sm:right-[max(1rem,env(safe-area-inset-right))] sm:top-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitcher className="border border-milkBrown/10 bg-paper/90 shadow-soft backdrop-blur-md" />
      </div>

      {!onboarded ? (
        <Onboarding
          onComplete={(data: OnboardingData) => {
            void saveOnboarding(data)
            setOnboarded(true)
          }}
        />
      ) : (
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route element={<Layout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/corner" element={<CornerPage />} />
            <Route path="/corner/blindspot-garden" element={<BlindspotGardenPage />} />
          </Route>
          <Route path="*" element={<WelcomePage />} />
        </Routes>
      )}
    </>
  )
}
