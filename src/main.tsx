import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import { NetworkProvider } from './context/NetworkContext'
import { LangProvider } from './i18n'
import './index.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <NetworkProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </NetworkProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
