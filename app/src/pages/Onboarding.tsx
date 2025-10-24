import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Logo, LoadingMoreIndicator } from '@/components'
import { onboardingService } from '@/services/onboarding'
import parametersService from '@/services/parameters'
import { OnboardingQuestion, OnboardingAnswer } from '@/types'
import { useToast } from '@/hooks'
import './Onboarding.css'

export const Onboarding: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const { success, error: showError } = useToast()

  const [questions, setQuestions] = useState<OnboardingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | number | [number, number]>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maxDistance, setMaxDistance] = useState(200)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  useEffect(() => {
    loadQuestions()
    loadParameters()
  }, [])

  const loadParameters = async () => {
    try {
      const maxDist = await parametersService.get<number>('matching.max_distance_km')
      setMaxDistance(maxDist)
    } catch (err) {
      console.error('Error loading parameters:', err)
    }
  }

  useEffect(() => {
    // Initialize default values for certain question types
    if (currentQuestion) {
      const existingAnswer = answers.find(a => a.questionId === currentQuestion.id)
      if (existingAnswer) {
        setCurrentAnswer(existingAnswer.answer as any)
      } else {
        // Set default values based on question key
        if (currentQuestion.key === 'preferenceAge') {
          // Calculate age range based on user's birthdate if available
          const birthDateAnswer = answers.find(a => a.questionId === questions.find(q => q.key === 'birthDate')?.id)
          if (birthDateAnswer && birthDateAnswer.answer) {
            const birthDate = new Date(birthDateAnswer.answer as string)
            const today = new Date()
            let userAge = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              userAge--
            }
            // ±10 years around user's age, but within 18-99 range
            const minAge = Math.max(18, userAge - 10)
            const maxAge = Math.min(99, userAge + 10)
            setCurrentAnswer([minAge, maxAge])
          } else {
            // Default to 18-99 if no birthdate yet
            setCurrentAnswer([18, 99])
          }
        } else if (currentQuestion.key === 'preferenceDistance') {
          // Default distance to 50 km
          setCurrentAnswer(50)
        } else if (currentQuestion.type === 'range' && currentQuestion.min !== undefined && currentQuestion.max !== undefined) {
          setCurrentAnswer([currentQuestion.min, currentQuestion.max])
        } else if (currentQuestion.type === 'slider' && currentQuestion.min !== undefined) {
          setCurrentAnswer(currentQuestion.min)
        } else if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'photo') {
          setCurrentAnswer([])
        } else {
          setCurrentAnswer('')
        }
      }
    }
  }, [currentIndex, currentQuestion, answers, questions])

  const loadQuestions = async () => {
    try {
      console.log('🔍 Chargement des questions...')
      const data = await onboardingService.getQuestions()
      console.log('✅ Questions reçues:', data)
      console.log('📊 Nombre de questions:', data?.length || 0)
      setQuestions(data)
    } catch (err) {
      console.error('❌ Erreur lors du chargement des questions:', err)
      showError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    // Validate answer
    if (currentQuestion?.required) {
      if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
        showError(t('validation.required'))
        return
      }
    }

    // Validate birth date (minimum 18 years old)
    if (currentQuestion?.type === 'date' && currentQuestion?.key === 'birthDate') {
      const birthDate = new Date(currentAnswer as string)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) {
        showError('Vous devez avoir au moins 18 ans')
        return
      }
    }

    // Validate minimum photos
    if (currentQuestion?.type === 'photo') {
      const minPhotos = await parametersService.get<number>('upload.min_photos_per_user')
      const photoCount = (currentAnswer as string[])?.length || 0

      if (photoCount < minPhotos) {
        showError(`Vous devez ajouter au moins ${minPhotos} photos`)
        return
      }
    }

    const newAnswer: OnboardingAnswer = {
      questionId: currentQuestion.id,
      questionKey: currentQuestion.key, // Include key to help backend identify field
      answer: currentAnswer,
    }

    setAnswers(prev => [...prev.filter(a => a.questionId !== currentQuestion.id), newAnswer])

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onboardingService.submitAnswers(answers)
      await onboardingService.completeOnboarding()
      updateUser({ onboardingComplete: true })
      success(t('onboarding.completeProfile'))
      navigate('/alter-chat')
    } catch (err) {
      showError(t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectOption = (option: string) => {
    if (currentQuestion.type === 'multiple_choice') {
      const current = Array.isArray(currentAnswer) ? currentAnswer as string[] : []
      if (current.includes(option)) {
        setCurrentAnswer(current.filter(o => o !== option))
      } else {
        setCurrentAnswer([...current, option])
      }
    } else {
      setCurrentAnswer(option)
    }
  }

  if (isLoading) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-loading">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Aucune question disponible. Veuillez contacter le support.
          </p>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
            Debug: {questions.length} questions chargées
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.75rem, 2vh, 1.25rem)', flexShrink: 0 }}>
          <Logo size={40} />
        </div>
        <div className="onboarding-progress">
          <div className="onboarding-progress-text">
            {t('onboarding.progress', { current: currentIndex + 1, total: questions.length })}
          </div>
          <div className="onboarding-progress-bar">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="onboarding-question">
          <h2 className="onboarding-question-text">{currentQuestion.question}</h2>

          <div className="onboarding-answer">
            {currentQuestion.type === 'text' && (
              <Input
                type="text"
                placeholder={currentQuestion.placeholder}
                value={currentAnswer as string}
                onChange={e => setCurrentAnswer(e.target.value)}
                fullWidth
                required={currentQuestion.required}
              />
            )}

            {currentQuestion.type === 'number' && (
              <Input
                type="number"
                placeholder={currentQuestion.placeholder}
                value={currentAnswer as string}
                onChange={e => setCurrentAnswer(e.target.value)}
                min={currentQuestion.min}
                max={currentQuestion.max}
                fullWidth
                required={currentQuestion.required}
              />
            )}

            {currentQuestion.type === 'date' && (
              <Input
                type="date"
                value={currentAnswer as string}
                onChange={e => setCurrentAnswer(e.target.value)}
                max={
                  currentQuestion.key === 'birthDate'
                    ? new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                        .toISOString()
                        .split('T')[0]
                    : undefined
                }
                fullWidth
                required={currentQuestion.required}
              />
            )}

            {(currentQuestion.type === 'single_choice' ||
              currentQuestion.type === 'multiple_choice') && (
              <div className="onboarding-options">
                {currentQuestion.options?.map(option => {
                  const isSelected = Array.isArray(currentAnswer)
                    ? (currentAnswer as string[]).includes(option)
                    : currentAnswer === option

                  return (
                    <button
                      key={option}
                      className={`onboarding-option ${isSelected ? 'onboarding-option--selected' : ''}`}
                      onClick={() => handleSelectOption(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'slider' && (
              <div className="onboarding-slider">
                <div className="onboarding-slider-label">
                  {currentAnswer} km
                </div>
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.key === 'preferenceDistance' ? maxDistance : currentQuestion.max}
                  value={currentAnswer as number}
                  onChange={e => setCurrentAnswer(Number(e.target.value))}
                  className="onboarding-slider-input"
                />
              </div>
            )}

            {currentQuestion.type === 'range' && (
              <div className="onboarding-range">
                <div className="onboarding-range-label">
                  {(currentAnswer as [number, number])?.[0] || 18} - {(currentAnswer as [number, number])?.[1] || 99} ans
                </div>
                <div className="onboarding-dual-range">
                  <input
                    type="range"
                    min={18}
                    max={99}
                    value={(currentAnswer as [number, number])?.[0] || 18}
                    onChange={e => {
                      const min = Number(e.target.value)
                      const max = (currentAnswer as [number, number])?.[1] ?? 99
                      if (min <= max) {
                        setCurrentAnswer([min, max])
                      }
                    }}
                    className="onboarding-dual-range-min"
                  />
                  <input
                    type="range"
                    min={18}
                    max={99}
                    value={(currentAnswer as [number, number])?.[1] || 99}
                    onChange={e => {
                      const max = Number(e.target.value)
                      const min = (currentAnswer as [number, number])?.[0] ?? 18
                      if (max >= min) {
                        setCurrentAnswer([min, max])
                      }
                    }}
                    className="onboarding-dual-range-max"
                  />
                  <div
                    className="onboarding-dual-range-track"
                    style={{
                      left: `${(((currentAnswer as [number, number])?.[0] || 18) - 18) / (99 - 18) * 100}%`,
                      right: `${100 - (((currentAnswer as [number, number])?.[1] || 99) - 18) / (99 - 18) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            {currentQuestion.type === 'photo' && (
              <div className="onboarding-photo">
                <div className="onboarding-photo-grid">
                  {[0, 1, 2, 3, 4, 5].map(index => {
                    const photoUrl = (currentAnswer as string[])?.[index]
                    return (
                      <div key={index} className="onboarding-photo-slot">
                        {photoUrl ? (
                          <>
                            <img
                              src={`${import.meta.env.VITE_API_URL}${photoUrl}`}
                              alt={`Photo ${index + 1}`}
                              className="onboarding-photo-image"
                            />
                            {index === 0 && (
                              <div className="onboarding-photo-badge">
                                {t('editProfile.mainPhoto')}
                              </div>
                            )}
                            <button
                              type="button"
                              className="onboarding-photo-remove"
                              onClick={() => {
                                const photos = (currentAnswer as string[]) || []
                                setCurrentAnswer(photos.filter((_, i) => i !== index))
                              }}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <label className="onboarding-photo-add">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async e => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                try {
                                  const formData = new FormData()
                                  formData.append('files', file)

                                  const token = localStorage.getItem('auth_token')
                                  const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/photos`, {
                                    method: 'POST',
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: formData,
                                  })

                                  if (!response.ok) {
                                    throw new Error('Upload failed')
                                  }

                                  const data = await response.json()
                                  const photoUrl = data.photos[0].url
                                  const photos = (currentAnswer as string[]) || []
                                  setCurrentAnswer([...photos, photoUrl])
                                } catch (err) {
                                  showError('Erreur lors de l\'upload')
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                            <span className="onboarding-photo-plus">+</span>
                            <span className="onboarding-photo-add-text">{t('onboarding.uploadPhoto')}</span>
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="onboarding-photo-hint">
                  {(currentAnswer as string[])?.length || 0} / 6 photos • {t('editProfile.minPhotos')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="onboarding-actions">
          {currentIndex > 0 && (
            <Button variant="ghost" onClick={handleBack}>
              {t('common.back')}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            loading={isSubmitting}
            style={{ marginLeft: 'auto' }}
          >
            {isLastQuestion ? t('common.done') : t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}