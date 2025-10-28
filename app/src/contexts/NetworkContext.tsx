import React, { createContext, useState, useEffect, useCallback } from 'react'
import { setNetworkErrorNotifier } from '@/services/api'

export type NetworkStatus = 'online' | 'offline' | 'slow'

export interface NetworkError {
  message: string
  timestamp: number
  type: 'offline' | 'timeout' | 'server_error'
}

interface NetworkContextValue {
  status: NetworkStatus
  isOnline: boolean
  lastError: NetworkError | null
  setNetworkError: (error: NetworkError) => void
  clearNetworkError: () => void
  checkNetworkSpeed: () => Promise<NetworkStatus>
}

export const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

interface NetworkProviderProps {
  children: React.ReactNode
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<NetworkStatus>('online')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastError, setLastError] = useState<NetworkError | null>(null)

  // Initialiser le notifier pour le service API
  useEffect(() => {
    setNetworkErrorNotifier((error: NetworkError) => {
      setLastError(error)
      if (error.type === 'offline') {
        setStatus('offline')
      } else if (error.type === 'timeout') {
        setStatus('slow')
      }
    })
  }, [])

  // Détection de la connexion online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network: Browser detected online')
      setIsOnline(true)
      setStatus('online')
      // Effacer toutes les erreurs offline quand on repasse en ligne
      setLastError(prev => {
        if (prev?.type === 'offline') {
          return null
        }
        return prev
      })
    }

    const handleOffline = () => {
      console.log('🔴 Network: Browser detected offline')
      setIsOnline(false)
      setStatus('offline')
      setLastError({
        message: 'Pas de connexion internet',
        timestamp: Date.now(),
        type: 'offline'
      })
    }

    // Vérifier l'état initial
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Vérification de la vitesse du réseau
  const checkNetworkSpeed = useCallback(async (): Promise<NetworkStatus> => {
    if (!navigator.onLine) {
      return 'offline'
    }

    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      // Ping simple vers l'API
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      await fetch(`${apiUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeout)
      const duration = Date.now() - startTime

      // Si la réponse prend plus de 2 secondes, le réseau est considéré comme lent
      const networkStatus = duration > 2000 ? 'slow' : 'online'
      setStatus(networkStatus)
      return networkStatus
    } catch (error) {
      // Si le fetch échoue, on considère le réseau comme lent ou offline
      setStatus('slow')
      return 'slow'
    }
  }, [])

  const setNetworkError = useCallback((error: NetworkError) => {
    setLastError(error)

    // Ajuster le status selon le type d'erreur
    if (error.type === 'offline') {
      setStatus('offline')
    } else if (error.type === 'timeout') {
      setStatus('slow')
    }
  }, [])

  const clearNetworkError = useCallback(() => {
    setLastError(null)
  }, [])

  const value: NetworkContextValue = {
    status,
    isOnline,
    lastError,
    setNetworkError,
    clearNetworkError,
    checkNetworkSpeed
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}
