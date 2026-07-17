/**
 * App — 路由根
 * 首次进入检测 onboarding：未完成则展示引导问卷，完成后进入正常路由。
 * 欢迎页 / 为沉浸式开场，不挂公共导航；其余内页共享 Layout。
 */
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import WelcomePage from '@/pages/WelcomePage'
import ChatPage from '@/pages/ChatPage'
import JournalPage from '@/pages/JournalPage'
import InsightsPage from '@/pages/InsightsPage'
import CornerPage from '@/pages/CornerPage'
import Onboarding, { type OnboardingData } from '@/components/Onboarding'
import { isOnboarded, saveOnboarding } from '@/services/api'

export default function App() {
  const [onboarded, setOnboarded] = useState(isOnboarded())

  // 首次进入：引导问卷（覆盖路由，完成后进入主应用）
  if (!onboarded) {
    return (
      <Onboarding
        onComplete={(data: OnboardingData) => {
          void saveOnboarding(data)
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route element={<Layout />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/corner" element={<CornerPage />} />
      </Route>
      <Route path="*" element={<WelcomePage />} />
    </Routes>
  )
}
