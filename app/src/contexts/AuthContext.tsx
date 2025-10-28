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
          // Charger l'utilisateur depuis le cache d'abord
          const cachedUser = localStorage.getItem('cached_user')
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
            } catch (e) {
              console.error('Failed to parse cached user:', e)
            }
          }

          try {
            const userData = await api.get<User>('/auth/me')
            setUser(userData)
            // Mettre en cache l'utilisateur
            localStorage.setItem('cached_user', JSON.stringify(userData))

            // Initialiser les notifications push sur plateforme native
            if (Capacitor.isNativePlatform()) {
              await notificationService.initialize()
            }
          } catch (error: any) {
            // Ne supprimer le token que si c'est une vraie erreur 401 (non autorisé)
            // Pas pour les erreurs réseau ou serveur
            if (error?.response?.status === 401) {
              console.log('Auth token invalid, logging out')
              localStorage.removeItem('auth_token')
              localStorage.removeItem('cached_user')
              setUser(null)
            } else {
              // Erreur réseau ou serveur : garder le token et l'utilisateur en cache
              console.log('Network/server error, keeping cached user')
              // Si on n'a pas de user en cache, on ne peut pas faire grand chose
              if (!cachedUser) {
                console.warn('No cached user available, user will need to re-login when back online')
              }
            }
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
    localStorage.setItem('cached_user', JSON.stringify(userData))
    setUser(userData)

    // Initialiser les notifications push sur plateforme native
    if (Capacitor.isNativePlatform()) {
      await notificationService.initialize()
    }
  }

  const register = async (email: string) => {
    const { token, user: userData } = await api.post<{ token: string; user: User }>('/auth/register', { email })
    localStorage.setItem('auth_token', token)
    localStorage.setItem('cached_user', JSON.stringify(userData))
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
    localStorage.removeItem('cached_user')
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      // Mettre à jour le cache
      localStorage.setItem('cached_user', JSON.stringify(updatedUser))
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