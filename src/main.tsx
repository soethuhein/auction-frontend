import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './app/auth/AuthContext'
import { AppRouterProvider } from './app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouterProvider />
    </AuthProvider>
  </StrictMode>,
)
