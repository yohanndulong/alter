import { useContext } from 'react'
import { NetworkContext } from '@/contexts/NetworkContext'

/**
 * Hook pour accéder au contexte réseau global
 * Permet de détecter l'état de la connexion et gérer les erreurs réseau
 */
export const useNetwork = () => {
  const context = useContext(NetworkContext)

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }

  return context
}
