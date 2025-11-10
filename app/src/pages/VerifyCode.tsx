import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Logo } from '@/components'
import { useToast } from '@/hooks'
import { api } from '@/services/api'
import { alterChatStorage } from '@/utils/alterChatStorage'
import './Auth.css'

export const VerifyCode: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { success, error: showError } = useToast()

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ code?: string }>({})
  const email = (location.state as { email?: string })?.email || localStorage.getItem('verifyEmail') || ''

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  const validateCode = () => {
    const newErrors: { code?: string } = {}

    if (!code) {
      newErrors.code = 'Code de vérification requis'
    } else if (code.length !== 6) {
      newErrors.code = 'Le code doit contenir 6 chiffres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCode()) return

    setIsLoading(true)
    try {
      await login(email, code)
      success('Connexion réussie')
      localStorage.removeItem('verifyEmail')

      // Vérifier si l'utilisateur a déjà discuté avec Alter
      const messages = await alterChatStorage.loadMessages()
      const hasAlterMessages = messages.length > 0

      // Rediriger vers alter-chat si pas de messages, sinon vers discover
      navigate(hasAlterMessages ? '/discover' : '/alter-chat')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await api.post('/auth/send-code', { email })
      success('Code renvoyé par email')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code')
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null
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
              <h2 className="auth-card-title">{t('auth.verification')}</h2>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-code-info">
                <p>{t('auth.codeSentTo')}</p>
                <strong>{email}</strong>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('verifyEmail')
                    navigate('/login')
                  }}
                  className="auth-change-email"
                >
                  {t('auth.change')}
                </button>
              </div>

              <Input
                type="text"
                label={t('auth.verificationCode')}
                placeholder={t('common.codePlaceholder')}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={errors.code}
                fullWidth
                required
                autoFocus
                maxLength={6}
              />

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                {t('auth.loginButton')}
              </Button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="auth-resend-button"
              >
                {t('auth.resendCode')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="auth-floating-elements">
        <div className="auth-floating-heart auth-floating-heart-1">💕</div>
        <div className="auth-floating-heart auth-floating-heart-2">💖</div>
        <div className="auth-floating-heart auth-floating-heart-3">✨</div>
        <div className="auth-floating-heart auth-floating-heart-4">💫</div>
      </div>
    </div>
  )
}
