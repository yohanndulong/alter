import React, { useEffect, useState } from 'react'
import { useNetwork } from '@/hooks'
import './NetworkStatus.css'

/**
 * Composant global qui affiche l'état du réseau
 * S'affiche en haut de l'écran quand il y a un problème réseau
 */
export const NetworkStatus: React.FC = () => {
  const { status, lastError, clearNetworkError } = useNetwork()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (lastError) {
      setIsVisible(true)

      // Auto-masquer après 5 secondes pour les erreurs non-critiques
      if (lastError.type !== 'offline') {
        const timeout = setTimeout(() => {
          setIsVisible(false)
          clearNetworkError()
        }, 5000)

        return () => clearTimeout(timeout)
      }
    } else if (status === 'online') {
      setIsVisible(false)
    }
  }, [lastError, status, clearNetworkError])

  // Ne rien afficher si tout va bien
  if (!isVisible || (!lastError && status === 'online')) {
    return null
  }

  const getStatusInfo = () => {
    if (lastError) {
      switch (lastError.type) {
        case 'offline':
          return {
            icon: '📡',
            message: 'Pas de connexion internet',
            description: 'Vérifiez votre connexion',
            className: 'network-status-offline'
          }
        case 'timeout':
          return {
            icon: '🐌',
            message: 'Connexion lente',
            description: 'Le chargement peut prendre du temps',
            className: 'network-status-slow'
          }
        case 'server_error':
          return {
            icon: '⚠️',
            message: 'Erreur serveur',
            description: 'Réessayez dans quelques instants',
            className: 'network-status-error'
          }
      }
    }

    if (status === 'slow') {
      return {
        icon: '🐌',
        message: 'Connexion lente',
        description: 'Le chargement peut prendre du temps',
        className: 'network-status-slow'
      }
    }

    return null
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  return (
    <div className={`network-status ${statusInfo.className}`}>
      <div className="network-status-content">
        <span className="network-status-icon">{statusInfo.icon}</span>
        <div className="network-status-text">
          <div className="network-status-message">{statusInfo.message}</div>
          <div className="network-status-description">{statusInfo.description}</div>
        </div>
      </div>
      {lastError?.type !== 'offline' && (
        <button
          className="network-status-close"
          onClick={() => {
            setIsVisible(false)
            clearNetworkError()
          }}
          aria-label="Fermer"
        >
          ✕
        </button>
      )}
    </div>
  )
}
