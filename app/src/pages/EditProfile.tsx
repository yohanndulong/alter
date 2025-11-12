import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Modal, CityAutocomplete } from '@/components'
import { useAuth } from '@/contexts/AuthContext'
import { useToast, useBackButtonNavigation } from '@/hooks'
import { api } from '@/services/api'
import { photosService, Photo } from '@/services/photos'
import parametersService from '@/services/parameters'
import './EditProfile.css'

const GENDER_OPTIONS = [
  { key: 'male', label: 'Homme' },
  { key: 'female', label: 'Femme' },
  { key: 'other', label: 'Autre' }
]

const SEXUAL_ORIENTATION_OPTIONS = [
  'heterosexual',
  'homosexual',
  'bisexual',
  'pansexual',
  'asexual',
  'other'
]

export const EditProfile: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  // Gérer le bouton retour - retourner au profil
  useBackButtonNavigation('/profile')

  const [photos, setPhotos] = useState<Photo[]>([])
  const [city, setCity] = useState('')
  const [sexualOrientation, setSexualOrientation] = useState('')
  const [preferences, setPreferences] = useState({
    ageMin: 18,
    ageMax: 50,
    genders: [] as string[],
    distance: 50,
    minCompatibility: 50
  })

  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [minPhotos, setMinPhotos] = useState(2)
  const [maxDistance, setMaxDistance] = useState(200)
  const [defaultMinCompatibility, setDefaultMinCompatibility] = useState(50)

  // Debounce timer for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const isInitializedRef = useRef(false)

  // Load photos and parameters once on mount
  useEffect(() => {
    loadPhotos()
    loadMinPhotos()
  }, [])

  // Cleanup: force save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)

        // Use navigator.sendBeacon for synchronous save on unmount
        // This ensures data is saved even if user closes the page
        const data = {
          city,
          sexualOrientation,
          preferenceAgeMin: preferences.ageMin,
          preferenceAgeMax: preferences.ageMax,
          preferenceDistance: preferences.distance,
          preferenceMinCompatibility: preferences.minCompatibility,
          preferenceGenders: preferences.genders
        }

        console.log('💾 [EditProfile] Cleanup: saving preferences on unmount', data)

        // Fallback to synchronous API call (best effort)
        api.put('/users/me', data).catch(err => {
          console.error('❌ [EditProfile] Cleanup save error:', err)
        })
      }
    }
  }, [city, sexualOrientation, preferences])

  // Load user data once when user is available
  useEffect(() => {
    if (user && !isInitializedRef.current) {
      setCity(user.city || '')
      setSexualOrientation(user.sexualOrientation || '')
      setPreferences({
        ageMin: user.preferenceAgeMin || 18,
        ageMax: user.preferenceAgeMax || 50,
        genders: user.preferenceGenders || [],
        distance: user.preferenceDistance || 50,
        minCompatibility: user.preferenceMinCompatibility ?? defaultMinCompatibility
      })
      isInitializedRef.current = true
    }
  }, [user, defaultMinCompatibility])

  const loadMinPhotos = async () => {
    try {
      const params = await parametersService.getMultiple([
        'upload.min_photos_per_user',
        'matching.max_distance_km',
        'matching.min_compatibility_default'
      ])
      setMinPhotos(params['upload.min_photos_per_user'] || 2)
      setMaxDistance(params['matching.max_distance_km'] || 200)
      setDefaultMinCompatibility(params['matching.min_compatibility_default'] || 50)
    } catch (err) {
      console.error('Error loading parameters:', err)
    }
  }

  const loadPhotos = async () => {
    try {
      setIsLoadingPhotos(true)
      const userPhotos = await photosService.getUserPhotos()
      setPhotos(userPhotos)
    } catch (err) {
      console.error('Error loading photos:', err)
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  // Auto-save function with debounce
  const autoSave = useCallback(async (data: any) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        console.log('💾 [EditProfile] Auto-saving preferences:', data)
        setSaveIndicator('saving')
        await api.put('/users/me', data)
        console.log('✅ [EditProfile] Preferences saved successfully')

        // Don't update local user context to avoid triggering infinite loops
        // The data is already saved to the API and will be reflected when needed

        setSaveIndicator('saved')
        setTimeout(() => setSaveIndicator('idle'), 2000)
      } catch (err) {
        console.error('❌ [EditProfile] Auto-save error:', err)
        showError(t('editProfile.saveError') || 'Erreur lors de la sauvegarde')
        setSaveIndicator('idle')
      }
    }, 800) // 800ms debounce
  }, [showError, t])

  const handleCityChange = (cityName: string, latitude?: number, longitude?: number) => {
    console.log('🌍 [EditProfile] City changed:', { cityName, latitude, longitude })
    setCity(cityName)
    autoSave({
      city: cityName,
      locationLatitude: latitude,
      locationLongitude: longitude
    })
  }

  const handleSexualOrientationChange = (value: string) => {
    const newValue = sexualOrientation === value ? '' : value
    console.log('🏳️‍🌈 [EditProfile] Sexual orientation changed:', { from: sexualOrientation, to: newValue })
    setSexualOrientation(newValue)
    autoSave({ sexualOrientation: newValue })
  }

  const handlePreferenceChange = (field: string, value: any) => {
    const newPreferences = { ...preferences, [field]: value }
    console.log('⚙️ [EditProfile] Preference changed:', { field, value, newPreferences })
    setPreferences(newPreferences)

    const dataToSave = {
      preferenceAgeMin: newPreferences.ageMin,
      preferenceAgeMax: newPreferences.ageMax,
      preferenceDistance: newPreferences.distance,
      preferenceMinCompatibility: newPreferences.minCompatibility,
      preferenceGenders: newPreferences.genders as ('male' | 'female' | 'other')[]
    }
    console.log('💾 [EditProfile] Saving preferences:', dataToSave)
    autoSave(dataToSave)
  }

  const togglePreferenceGender = (gender: string) => {
    const newGenders = preferences.genders.includes(gender)
      ? preferences.genders.filter(g => g !== gender)
      : [...preferences.genders, gender]

    console.log('👤 [EditProfile] Gender preference toggled:', { gender, newGenders })
    const newPreferences = { ...preferences, genders: newGenders }
    setPreferences(newPreferences)

    const dataToSave = {
      preferenceAgeMin: newPreferences.ageMin,
      preferenceAgeMax: newPreferences.ageMax,
      preferenceDistance: newPreferences.distance,
      preferenceMinCompatibility: newPreferences.minCompatibility,
      preferenceGenders: newGenders as ('male' | 'female' | 'other')[]
    }
    console.log('💾 [EditProfile] Saving gender preferences:', dataToSave)
    autoSave(dataToSave)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (photos.length >= 6) {
      showError(t('editProfile.maxPhotos'))
      return
    }

    setIsUploadingPhoto(true)
    try {
      const newPhoto = await photosService.uploadPhoto(file)
      setPhotos(prev => [...prev, newPhoto])
      success(t('editProfile.photoAdded') || 'Photo ajoutée')
    } catch (err: any) {
      showError(err.message || t('editProfile.uploadError'))
    } finally {
      setIsUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    // Check if deleting would go below minimum
    if (photos.length <= minPhotos) {
      showError(`Vous devez avoir au moins ${minPhotos} photos`)
      return
    }
    setPhotoToDelete(photoId)
    setShowDeletePhotoModal(true)
  }

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return

    try {
      await photosService.deletePhoto(photoToDelete)
      setPhotos(prev => prev.filter(p => p.id !== photoToDelete))
      success(t('editProfile.photoDeleted') || 'Photo supprimée')
    } catch (err) {
      showError(t('editProfile.deleteError') || 'Erreur lors de la suppression')
    } finally {
      setShowDeletePhotoModal(false)
      setPhotoToDelete(null)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    try {
      await photosService.setPrimaryPhoto(photoId)
      setPhotos(prev => prev.map(p => ({
        ...p,
        isPrimary: p.id === photoId
      })))
      success(t('editProfile.primaryPhotoSet') || 'Photo principale définie')
    } catch (err) {
      showError(t('editProfile.primaryPhotoError') || 'Erreur')
    }
  }

  const handleBack = async () => {
    // Force save immediately if there's a pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)

      // Force immediate save with current preferences
      try {
        console.log('💾 [EditProfile] Force saving on navigation')
        await api.put('/users/me', {
          city,
          sexualOrientation,
          preferenceAgeMin: preferences.ageMin,
          preferenceAgeMax: preferences.ageMax,
          preferenceDistance: preferences.distance,
          preferenceMinCompatibility: preferences.minCompatibility,
          preferenceGenders: preferences.genders as ('male' | 'female' | 'other')[]
        })
        console.log('✅ [EditProfile] Force save complete')
      } catch (err) {
        console.error('❌ [EditProfile] Force save error:', err)
      }
    }
    navigate('/profile')
  }

  if (!user) {
    return null
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-content">
        <div className="edit-profile-header">
          <button onClick={handleBack} className="edit-profile-back-button">
            ← {t('common.back')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 className="edit-profile-title">{t('editProfile.title')}</h1>
            {saveIndicator !== 'idle' && (
              <span className="edit-profile-save-indicator">
                {saveIndicator === 'saving' ? t('editProfile.saving') : t('editProfile.saved')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="edit-profile-sections-container">
        <div className="edit-profile-sections-wrapper">
          {/* Photos Section */}
          <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">{t('editProfile.photos')}</h2>
          <p className="edit-profile-section-subtitle">
            {t('editProfile.minPhotos')} • {photos.length}/6
          </p>

          {photos.length < minPhotos && (
            <div style={{
              background: 'var(--color-warning)',
              color: 'var(--color-text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ⚠️ Vous devez ajouter au moins {minPhotos} photos pour compléter votre profil ({photos.length}/{minPhotos})
            </div>
          )}

          <Card>
            <div className="edit-profile-photos">
              {isLoadingPhotos ? (
                <div className="edit-profile-loading">{t('common.loading')}</div>
              ) : (
                <>
                  {photos.map((photo) => (
                    <div key={photo.id} className="edit-profile-photo">
                      <img
                        src={photosService.getPhotoUrl(photo)}
                        alt="Profile"
                      />
                      {photo.isPrimary && (
                        <div className="edit-profile-photo-badge">
                          {t('editProfile.mainPhoto')}
                        </div>
                      )}
                      <div className="edit-profile-photo-actions">
                        {!photo.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(photo.id)}
                            className="edit-profile-photo-action-btn"
                            title={t('editProfile.setAsMain') || 'Définir comme principale'}
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="edit-profile-photo-action-btn edit-profile-photo-action-btn--delete"
                          title={t('editProfile.removePhoto')}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {photos.length < 6 && (
                    <label className="edit-profile-photo-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        style={{ display: 'none' }}
                      />
                      <div className="edit-profile-photo-upload-content">
                        {isUploadingPhoto ? (
                          <span>{t('editProfile.uploading')}</span>
                        ) : (
                          <>
                            <span className="edit-profile-photo-upload-icon">+</span>
                            <span className="edit-profile-photo-upload-text">
                              {t('editProfile.addPhoto')}
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Basic Info Section */}
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">{t('editProfile.basicInfo')}</h2>

          <Card>
            <div className="edit-profile-preference-item">
              <CityAutocomplete
                label={t('editProfile.city')}
                placeholder={t('editProfile.cityPlaceholder')}
                value={city}
                onChange={handleCityChange}
              />
            </div>

            <div className="edit-profile-preference-item">
              <label className="edit-profile-preference-label">
                {t('editProfile.sexualOrientation')}
              </label>
              <div className="edit-profile-gender-buttons">
                {SEXUAL_ORIENTATION_OPTIONS.map((orientation) => (
                  <button
                    key={orientation}
                    onClick={() => handleSexualOrientationChange(orientation)}
                    className={`edit-profile-gender-button ${
                      sexualOrientation === orientation ? 'edit-profile-gender-button--active' : ''
                    }`}
                  >
                    {t(`onboarding.${orientation}`)}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">{t('editProfile.preferences')}</h2>

          <Card>
            <div className="edit-profile-preference-item">
              <label className="edit-profile-preference-label">
                {t('editProfile.ageRange')}: {preferences.ageMin} - {preferences.ageMax} ans
              </label>
              <div className="edit-profile-dual-range">
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.ageMin}
                  onChange={(e) => {
                    const min = parseInt(e.target.value)
                    if (min <= preferences.ageMax) {
                      handlePreferenceChange('ageMin', min)
                    }
                  }}
                  className="edit-profile-dual-range-min"
                />
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.ageMax}
                  onChange={(e) => {
                    const max = parseInt(e.target.value)
                    if (max >= preferences.ageMin) {
                      handlePreferenceChange('ageMax', max)
                    }
                  }}
                  className="edit-profile-dual-range-max"
                />
                <div
                  className="edit-profile-dual-range-track"
                  style={{
                    left: `${(preferences.ageMin - 18) / (99 - 18) * 100}%`,
                    right: `${100 - (preferences.ageMax - 18) / (99 - 18) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="edit-profile-preference-item">
              <label className="edit-profile-preference-label">
                {t('editProfile.preferenceGenders')}
              </label>
              <div className="edit-profile-gender-buttons">
                {GENDER_OPTIONS.map((gender) => (
                  <button
                    key={gender.key}
                    onClick={() => togglePreferenceGender(gender.key)}
                    className={`edit-profile-gender-button ${
                      preferences.genders.includes(gender.key) ? 'edit-profile-gender-button--active' : ''
                    }`}
                  >
                    {t(`onboarding.${gender.key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-profile-preference-item">
              <label className="edit-profile-preference-label">
                {t('editProfile.distance')}: {preferences.distance} km
              </label>
              <input
                type="range"
                min="5"
                max={maxDistance}
                value={preferences.distance}
                onChange={(e) => handlePreferenceChange('distance', parseInt(e.target.value))}
                className="edit-profile-slider"
              />
            </div>

            <div className="edit-profile-preference-item">
              <label className="edit-profile-preference-label">
                Compatibilité minimale: {preferences.minCompatibility}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={preferences.minCompatibility}
                onChange={(e) => handlePreferenceChange('minCompatibility', parseInt(e.target.value))}
                className="edit-profile-slider"
              />
            </div>
          </Card>
        </div>
        </div>
      </div>

      {/* Delete Photo Modal */}
      <Modal
        isOpen={showDeletePhotoModal}
        onClose={() => setShowDeletePhotoModal(false)}
        size="sm"
      >
        <div className="edit-profile-modal">
          <h3 className="edit-profile-modal-title">{t('editProfile.deletePhoto')}</h3>
          <p className="edit-profile-modal-text">{t('editProfile.deletePhotoMessage')}</p>
          <div className="edit-profile-modal-actions">
            <button
              className="edit-profile-modal-button edit-profile-modal-button--secondary"
              onClick={() => setShowDeletePhotoModal(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              className="edit-profile-modal-button edit-profile-modal-button--primary"
              onClick={confirmDeletePhoto}
            >
              {t('editProfile.removePhoto')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
