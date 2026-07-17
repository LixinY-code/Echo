/**
 * App — 路由根
 * 欢迎页 / 为沉浸式开场，不挂公共导航；
 * 其余内页共享 Layout（Navbar + 页面过渡）。
 */
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import WelcomePage from '@/pages/WelcomePage'
import ChatPage from '@/pages/ChatPage'
import JournalPage from '@/pages/JournalPage'
import InsightsPage from '@/pages/InsightsPage'
import CornerPage from '@/pages/CornerPage'

export default function App() {
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
