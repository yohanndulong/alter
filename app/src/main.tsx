import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import './styles/design-system.css'

// Initialize mock API server if enabled
async function initializeApp() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMockServer } = await import('./mocks')
    await startMockServer()
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

initializeApp()