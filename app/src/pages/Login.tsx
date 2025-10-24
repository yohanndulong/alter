import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Input, Logo, NetworkAnimation } from '@/components'
import { useToast } from '@/hooks'
import './Auth.css'

export const Login: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})

  const validateEmail = () => {
    const newErrors: { email?: string } = {}

    if (!email) {
      newErrors.email = t('auth.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.email')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) return

    setIsLoading(true)
    try {
      // Import API service
      const { api } = await import('@/services/api')

      // Envoyer le code de vérification par email via l'API
      await api.post('/auth/send-code', { email })

      success('Code de vérification envoyé par email')
      localStorage.setItem('verifyEmail', email)
      navigate('/verify-code', { state: { email } })
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <Logo size={120} />
          <h1 className="auth-hero-title-minimal">
            {t('auth.heroTitle')} <span className="auth-hero-gradient">{t('auth.heroHighlight')}</span>
          </h1>
          <p className="auth-hero-tagline">{t('auth.heroTagline')}</p>
        </div>

        <div className="auth-form-section">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">{t('auth.startAdventure')}</h2>
            </div>

            <form className="auth-form" onSubmit={handleEmailSubmit}>
              <Input
                type="email"
                label={t('auth.email')}
                placeholder={t('common.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={errors.email}
                fullWidth
                required
                autoFocus
              />

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                {t('auth.receiveCode')}
              </Button>

              <div className="auth-security-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('auth.securityNote')}</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="auth-network-background">
        <NetworkAnimation />
      </div>
    </div>
  )
}