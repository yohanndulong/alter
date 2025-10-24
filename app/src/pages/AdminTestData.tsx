import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components'
import { useToast } from '@/hooks'
import { api } from '@/services/api'
import './AdminTestData.css'

export const AdminTestData: React.FC = () => {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [isGenerating, setIsGenerating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const [usersCount, setUsersCount] = useState(20)
  const [withProfiles, setWithProfiles] = useState(true)
  const [withMatches, setWithMatches] = useState(true)
  const [withLikes, setWithLikes] = useState(true)
  const [withMessages, setWithMessages] = useState(true)

  const handleGenerateData = async () => {
    setIsGenerating(true)
    try {
      const response = await api.post<{ users: number; message: string }>('/admin/generate-test-data', {
        usersCount,
        withProfiles,
        withMatches,
        withLikes,
        withMessages,
      })

      success(`${response.users} utilisateurs générés avec succès !`)
    } catch (err) {
      console.error('Erreur lors de la génération:', err)
      showError('Erreur lors de la génération des données')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearTestData = async () => {
    if (!confirm('Voulez-vous vraiment supprimer toutes les données de test ?')) {
      return
    }

    setIsClearing(true)
    try {
      await api.delete('/admin/test-data')
      success('Données de test supprimées')
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      showError('Erreur lors de la suppression des données de test')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="admin-test-data-container">
      <div className="admin-test-data-content">
        <div className="admin-test-data-header">
          <button onClick={() => navigate(-1)} className="admin-test-data-back-button">
            ← Retour
          </button>
          <h1 className="admin-test-data-title">Gestion des données de test</h1>
          <p className="admin-test-data-subtitle">Créez et supprimez des utilisateurs pour tester l'application</p>
        </div>

        <Card className="admin-test-data-card">
          <h2 className="admin-test-data-section-title">Générer des données de test</h2>

          <div className="admin-test-data-form">
            <div className="admin-test-data-field">
              <label htmlFor="usersCount" className="admin-test-data-label">
                Nombre d'utilisateurs
              </label>
              <input
                id="usersCount"
                type="number"
                min="1"
                max="100"
                value={usersCount}
                onChange={(e) => setUsersCount(parseInt(e.target.value))}
                className="admin-test-data-input"
              />
            </div>

            <div className="admin-test-data-checkboxes">
              <label className="admin-test-data-checkbox">
                <input
                  type="checkbox"
                  checked={withProfiles}
                  onChange={(e) => setWithProfiles(e.target.checked)}
                />
                <span>Profils complets ALTER</span>
              </label>

              <label className="admin-test-data-checkbox">
                <input
                  type="checkbox"
                  checked={withLikes}
                  onChange={(e) => setWithLikes(e.target.checked)}
                />
                <span>Likes aléatoires</span>
              </label>

              <label className="admin-test-data-checkbox">
                <input
                  type="checkbox"
                  checked={withMatches}
                  onChange={(e) => setWithMatches(e.target.checked)}
                />
                <span>Matches mutuels</span>
              </label>

              <label className="admin-test-data-checkbox">
                <input
                  type="checkbox"
                  checked={withMessages}
                  onChange={(e) => setWithMessages(e.target.checked)}
                />
                <span>Messages de conversation</span>
              </label>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateData}
              loading={isGenerating}
              disabled={isGenerating}
              fullWidth
            >
              {isGenerating ? 'Génération en cours...' : 'Générer les données'}
            </Button>
          </div>
        </Card>

        <Card className="admin-test-data-card admin-test-data-card--warning">
          <h2 className="admin-test-data-section-title">Supprimer les données de test</h2>
          <p className="admin-test-data-description">
            Supprime uniquement les utilisateurs créés avec @alter.test ainsi que leurs likes, matches et messages
          </p>
          <Button
            variant="secondary"
            onClick={handleClearTestData}
            loading={isClearing}
            disabled={isClearing}
            fullWidth
          >
            {isClearing ? 'Suppression...' : 'Supprimer les données de test'}
          </Button>
        </Card>

      </div>
    </div>
  )
}
