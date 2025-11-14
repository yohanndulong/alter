import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, Card } from '@/components'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'
import { getProfileImageUrl } from '@/utils/image'
import { api } from '@/services/api'
import { useToast } from '@/hooks'
import './Profile.css'

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { success, error: showError } = useToast()
  const [currentVersion, setCurrentVersion] = useState<string>('--')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadVersionInfo = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Récupérer la version du bundle actuel (OTA ou native)
          const currentBundle = await CapacitorUpdater.current()
          setCurrentVersion(currentBundle.bundle.version || currentBundle.native)
        } catch (error) {
          console.error('Error getting app version:', error)
        }
      } else {
        setCurrentVersion('Web')
      }
    }

    loadVersionInfo()
  }, [])

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      await api.delete('/users/me')
      success(t('profile.accountDeleted'))
      logout()
      navigate('/login')
    } catch (err) {
      showError(t('profile.deleteError'))
      setShowDeleteConfirm(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {getProfileImageUrl(user) ? (
              <img src={getProfileImageUrl(user)} alt={user.name || 'User'} className="profile-avatar-image-large" />
            ) : (
              <span className="profile-avatar-placeholder">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <h1 className="profile-name">
            {user.name || 'Utilisateur'}{user.age ? `, ${user.age}` : ''}
          </h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <Button variant="outline" onClick={() => navigate('/profile/edit')}>
            {t('profile.editProfile')}
          </Button>
        </div>

        <div className="profile-section">
          <h2 className="profile-section-title">{t('profile.settings')}</h2>

          <Card padding="none" className="profile-settings">
            <div className="profile-setting-item">
              <span className="profile-setting-label">{t('profile.theme')}</span>
              <div className="profile-theme-buttons">
                <button
                  className={`profile-theme-button ${theme === 'light' ? 'profile-theme-button--active' : ''}`}
                  onClick={() => setTheme('light')}
                  title={t('profile.themeLight')}
                >
                  ☀️
                </button>
                <button
                  className={`profile-theme-button ${theme === 'dark' ? 'profile-theme-button--active' : ''}`}
                  onClick={() => setTheme('dark')}
                  title={t('profile.themeDark')}
                >
                  🌙
                </button>
                <button
                  className={`profile-theme-button ${theme === 'blue' ? 'profile-theme-button--active' : ''}`}
                  onClick={() => setTheme('blue')}
                  title={t('profile.themeBlue')}
                >
                  🌊
                </button>
              </div>
            </div>

            <div className="profile-setting-item">
              <span className="profile-setting-label">{t('profile.language')}</span>
              <div className="profile-language-buttons">
                <button
                  className={`profile-language-button ${i18n.language === 'fr' ? 'profile-language-button--active' : ''}`}
                  onClick={() => handleLanguageChange('fr')}
                >
                  🇫🇷 FR
                </button>
                <button
                  className={`profile-language-button ${i18n.language === 'en' ? 'profile-language-button--active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            <button className="profile-setting-item" onClick={() => navigate('/settings/notifications')}>
              <span className="profile-setting-label">{t('profile.notifications')}</span>
              <span className="profile-setting-arrow">›</span>
            </button>

          </Card>
        </div>

        {user.isAdmin && (
          <div className="profile-section">
            <h2 className="profile-section-title">Admin</h2>

            <Card padding="none" className="profile-settings">
              <button className="profile-setting-item" onClick={() => navigate('/admin/parameters')}>
                <span className="profile-setting-label">⚙️ Paramètres système</span>
                <span className="profile-setting-arrow">›</span>
              </button>

              <button className="profile-setting-item" onClick={() => navigate('/admin/alter-reset')}>
                <span className="profile-setting-label">🔄 Réinitialiser ALTER</span>
                <span className="profile-setting-arrow">›</span>
              </button>

              <button className="profile-setting-item" onClick={() => navigate('/admin/test-data')}>
                <span className="profile-setting-label">🧪 Gestion des données de test</span>
                <span className="profile-setting-arrow">›</span>
              </button>
            </Card>
          </div>
        )}

        <div className="profile-section">
          <h2 className="profile-section-title">{t('profile.about')}</h2>

          <Card padding="none" className="profile-settings">
            <button className="profile-setting-item" onClick={() => window.open('/terms', '_blank')}>
              <span className="profile-setting-label">{t('profile.termsOfService')}</span>
              <span className="profile-setting-arrow">›</span>
            </button>

            <button
              className="profile-setting-item"
              onClick={() => navigate('/privacy')}
            >
              <span className="profile-setting-label">{t('profile.privacyPolicy')}</span>
              <span className="profile-setting-arrow">›</span>
            </button>

            <div className="profile-setting-item profile-setting-item--info">
              <span className="profile-setting-label">{t('profile.currentVersion')}</span>
              <span className="profile-setting-value">{currentVersion}</span>
            </div>
          </Card>
        </div>

        <div className="profile-actions">
          <Button variant="outline" onClick={handleLogout} fullWidth>
            {t('auth.logout')}
          </Button>
        </div>

        <div className="profile-section profile-danger-zone">
          <Card padding="md" className="profile-delete-account">
            <p className="profile-delete-warning">
              {t('profile.deleteWarning')}
            </p>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className={showDeleteConfirm ? 'profile-delete-confirm' : ''}
              fullWidth
            >
              {showDeleteConfirm ? t('profile.confirmDelete') : t('profile.deleteAccount')}
            </Button>
            {showDeleteConfirm && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                fullWidth
                style={{ marginTop: '8px' }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}