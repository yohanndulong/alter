import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { api } from '@/services/api'
import { notificationService } from '@/services/notifications'
import { Capacitor } from '@capacitor/core'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, code: string) => Promise<void>
  register: (email: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  verifyEmail: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          try {
            const userData = await api.get<User>('/auth/me')
            setUser(userData)

            // Initialiser les notifications push sur plateforme native
            if (Capacitor.isNativePlatform()) {
              await notificationService.initialize()
            }
          } catch {
            localStorage.removeItem('auth_token')
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, code: string) => {
    const { token, user: userData } = await api.post<{ token: string; user: User }>('/auth/login', { email, code })
    localStorage.setItem('auth_token', token)
    setUser(userData)

    // Initialiser les notifications push sur plateforme native
    if (Capacitor.isNativePlatform()) {
      await notificationService.initialize()
    }
  }

  const register = async (email: string) => {
    const { token, user: userData } = await api.post<{ token: string; user: User }>('/auth/register', { email })
    localStorage.setItem('auth_token', token)
    setUser(userData)

    // Initialiser les notifications push sur plateforme native
    if (Capacitor.isNativePlatform()) {
      await notificationService.initialize()
    }
  }

  const logout = async () => {
    // Désenregistrer les notifications push
    if (Capacitor.isNativePlatform()) {
      await notificationService.unregister()
    }

    localStorage.removeItem('auth_token')
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const verifyEmail = async (code: string) => {
    await api.post('/auth/verify-email', { code })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}