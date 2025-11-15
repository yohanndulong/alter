import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { UnreadCountProvider } from './contexts/UnreadCountContext'
import { NetworkProvider } from './contexts/NetworkContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ToastContainer, BottomNav, NetworkStatus, UpdateModal } from './components'
import { useToast, useAppUpdater } from './hooks'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { queryClient } from './lib/queryClient'
import { moderationService } from './services/moderation'
import { alterChatStorage } from './utils/alterChatStorage'
import { privacyScreenService } from './services/privacyScreen'
import { badgeService } from './services/badge'

import { Introduction } from './pages/Introduction'
import { Login } from './pages/Login'
import { VerifyCode } from './pages/VerifyCode'
import { Onboarding } from './pages/Onboarding'
import { AlterChat } from './pages/AlterChat'
import { Discover } from './pages/Discover'
import { Likes } from './pages/Likes'
import { Matches } from './pages/Matches'
import { Chat } from './pages/Chat'
import { Profile } from './pages/Profile'
import { EditProfile } from './pages/EditProfile'
import { AdminParameters } from './pages/AdminParameters'
import { AdminAlterReset } from './pages/AdminAlterReset'
import { AdminTestData } from './pages/AdminTestData'
import { PrivacyPolicy } from './pages/PrivacyPolicy'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Redirect to onboarding if not completed (except if already on onboarding page)
  if (user && !user.onboardingComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />
  }

  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!user?.isAdmin) {
    return <Navigate to="/profile" />
  }

  return <>{children}</>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [hasAlterMessages, setHasAlterMessages] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAlterMessages = async () => {
      const messages = await alterChatStorage.loadMessages()
      setHasAlterMessages(messages.length > 0)
    }

    if (isAuthenticated && user?.onboardingComplete) {
      checkAlterMessages()
    }
  }, [isAuthenticated, user?.onboardingComplete])

  if (isLoading || (isAuthenticated && user?.onboardingComplete && hasAlterMessages === null)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <>{children}</>
  }

  // Redirect authenticated users to onboarding if not completed
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" />
  }

  // Redirect to alter-chat if user hasn't chatted with Alter yet
  const redirectTo = !hasAlterMessages ? '/alter-chat' : '/discover'
  return <Navigate to={redirectTo} />
}

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [hasAlterMessages, setHasAlterMessages] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAlterMessages = async () => {
      const messages = await alterChatStorage.loadMessages()
      setHasAlterMessages(messages.length > 0)
    }

    if (isAuthenticated && user?.onboardingComplete) {
      checkAlterMessages()
    }
  }, [isAuthenticated, user?.onboardingComplete])

  if (isLoading || (isAuthenticated && user?.onboardingComplete && hasAlterMessages === null)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    )
  }

  // Check if user has seen the introduction
  const hasSeenIntro = localStorage.getItem('intro_completed') === 'true'

  if (!isAuthenticated) {
    // Redirect to intro if not seen, otherwise to login
    return <Navigate to={hasSeenIntro ? "/login" : "/introduction"} />
  }

  // Redirect to onboarding if not completed
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" />
  }

  // Redirect to alter-chat if user hasn't chatted with Alter yet
  const redirectTo = !hasAlterMessages ? '/alter-chat' : '/discover'
  return <Navigate to={redirectTo} />
}

const AppRoutes: React.FC = () => {
  const { toasts, removeToast } = useToast()

  // Précharger le modèle NSFW au démarrage de l'app
  useEffect(() => {
    console.log('🚀 Preloading NSFW detection model...')
    moderationService.preload().then(() => {
      console.log('✅ NSFW model preloaded successfully')
    }).catch(error => {
      console.error('❌ Failed to preload NSFW model:', error)
    })
  }, [])

  // Désactiver la protection contre les captures d'écran au démarrage
  // Elle sera activée uniquement sur la page Chat
  useEffect(() => {
    privacyScreenService.disable()
    console.log('🔓 Privacy screen disabled globally - will be enabled only on Chat page')
  }, [])

  // Réinitialiser le badge iOS quand l'app devient active
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    // Réinitialiser au démarrage
    badgeService.clearBadge()

    // Écouter les changements d'état de l'app
    let listenerHandle: any = null

    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App became active, clearing badge')
        badgeService.clearBadge()
      }
    }).then(handle => {
      listenerHandle = handle
    })

    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [])

  // Enable OTA updates only on native platforms
  const updateUrl = import.meta.env.VITE_UPDATE_URL || 'https://your-domain.com/updates/version.json'
  const checkInterval = parseInt(import.meta.env.VITE_UPDATE_CHECK_INTERVAL || '60', 10)
  const { updateAvailable, handleUpdate } = Capacitor.isNativePlatform()
    ? useAppUpdater(updateUrl, checkInterval)
    : { updateAvailable: null, handleUpdate: async () => {} }

  return (
    <>
      <NetworkStatus />
      {updateAvailable && (
        <UpdateModal
          version={updateAvailable.version}
          notes={updateAvailable.notes}
          onUpdate={handleUpdate}
        />
      )}
      <Routes>
        <Route path="/introduction" element={<Introduction />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-code"
          element={
            <PublicRoute>
              <VerifyCode />
            </PublicRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />
        <Route
          path="/alter-chat"
          element={
            <PrivateRoute>
              <AlterChat />
            </PrivateRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <PrivateRoute>
              <Discover />
            </PrivateRoute>
          }
        />
        <Route
          path="/likes"
          element={
            <PrivateRoute>
              <Likes />
            </PrivateRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <PrivateRoute>
              <Matches />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivateRoute>
              <EditProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/parameters"
          element={
            <AdminRoute>
              <AdminParameters />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/alter-reset"
          element={
            <AdminRoute>
              <AdminAlterReset />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/test-data"
          element={
            <AdminRoute>
              <AdminTestData />
            </AdminRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
      <BottomNav />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <WebSocketProvider>
              <UnreadCountProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </UnreadCountProvider>
            </WebSocketProvider>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
      {/* DevTools uniquement en développement */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App