import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components'
import { api } from '@/services/api'
import './AdminAlterReset.css'

export const AdminAlterReset: React.FC = () => {
  const navigate = useNavigate()
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await api.delete('/chat/ai/reset')
      alert('✅ Chat ALTER réinitialisé avec succès ! Vous pouvez recommencer votre échange avec ALTER.')
      navigate('/chat/ai')
    } catch (error) {
      console.error('Error resetting ALTER chat:', error)
      alert('❌ Erreur lors de la réinitialisation. Veuillez réessayer.')
    } finally {
      setIsResetting(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="admin-alter-reset-container">
      <div className="admin-alter-reset-header">
        <button className="admin-alter-reset-back" onClick={() => navigate('/profile')}>
          ← Retour
        </button>
        <h1 className="admin-alter-reset-title">Réinitialiser ALTER</h1>
      </div>

      <div className="admin-alter-reset-content">
        <Card>
          <div className="admin-alter-reset-warning">
            <div className="admin-alter-reset-warning-icon">⚠️</div>
            <h2 className="admin-alter-reset-warning-title">Attention : Action irréversible</h2>
            <p className="admin-alter-reset-warning-text">
              Cette action va supprimer toutes les données générées par ALTER :
            </p>
          </div>

          <div className="admin-alter-reset-list">
            <div className="admin-alter-reset-list-item">
              <span className="admin-alter-reset-list-icon">💬</span>
              <span className="admin-alter-reset-list-text">
                <strong>Tous les messages</strong> échangés avec ALTER
              </span>
            </div>
            <div className="admin-alter-reset-list-item">
              <span className="admin-alter-reset-list-icon">📝</span>
              <span className="admin-alter-reset-list-text">
                <strong>Le résumé du profil</strong> (alterSummary)
              </span>
            </div>
            <div className="admin-alter-reset-list-item">
              <span className="admin-alter-reset-list-icon">🧠</span>
              <span className="admin-alter-reset-list-text">
                <strong>Le profil AI</strong> (personnalité, intention, identité, etc.)
              </span>
            </div>
            <div className="admin-alter-reset-list-item">
              <span className="admin-alter-reset-list-icon">🔢</span>
              <span className="admin-alter-reset-list-text">
                <strong>L'embedding du profil</strong> (vecteur de similarité)
              </span>
            </div>
            <div className="admin-alter-reset-list-item">
              <span className="admin-alter-reset-list-icon">📊</span>
              <span className="admin-alter-reset-list-text">
                <strong>Le taux de completion</strong> du profil ALTER
              </span>
            </div>
          </div>

          <div className="admin-alter-reset-safe">
            <div className="admin-alter-reset-safe-icon">✅</div>
            <h3 className="admin-alter-reset-safe-title">Données conservées</h3>
            <p className="admin-alter-reset-safe-text">
              Les données de votre profil de base (nom, âge, photos, bio, réponses d'onboarding)
              ne seront <strong>pas affectées</strong>. Vous ne devrez pas refaire l'onboarding.
            </p>
          </div>

          {!showConfirmation ? (
            <div className="admin-alter-reset-actions">
              <Button variant="outline" onClick={() => navigate('/profile')} fullWidth>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowConfirmation(true)}
                fullWidth
              >
                Continuer
              </Button>
            </div>
          ) : (
            <div className="admin-alter-reset-confirmation">
              <p className="admin-alter-reset-confirmation-text">
                Êtes-vous sûr de vouloir réinitialiser votre échange avec ALTER ?
              </p>
              <div className="admin-alter-reset-actions">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isResetting}
                  fullWidth
                >
                  Non, annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReset}
                  disabled={isResetting}
                  fullWidth
                >
                  {isResetting ? 'Réinitialisation...' : 'Oui, réinitialiser'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
