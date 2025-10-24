import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ProfileModal, ProfileThumbnail, LoadingMoreIndicator } from '@/components'
import { User } from '@/types'
import { useInterestedProfiles, useLikeProfile } from '@/hooks'
import { getImageUrl } from '@/utils/image'
import './Likes.css'

export const Likes: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selectedProfile, setSelectedProfile] = useState<User | null>(null)

  // React Query - Charger les profils intéressés avec cache auto
  const { data: profiles = [], isLoading } = useInterestedProfiles()

  // Mutation pour liker (invalide le cache automatiquement)
  const likeMutation = useLikeProfile()

  const handleProfileClick = (profile: User) => {
    setSelectedProfile(profile)
  }

  const handleCloseModal = () => {
    setSelectedProfile(null)
  }

  const handleLike = async () => {
    if (!selectedProfile) return

    likeMutation.mutate(selectedProfile.id, {
      onSuccess: () => {
        setSelectedProfile(null)
      }
    })
  }

  const handleBack = () => {
    navigate('/discover')
  }

  if (isLoading) {
    return (
      <div className="likes-container">
        <div className="likes-loading">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="likes-container">
        <div className="likes-header">
          <button className="likes-back-button" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="likes-title">Qui m'a liké</h1>
          <div className="likes-spacer" />
        </div>
        <div className="likes-empty">
          <div className="likes-empty-icon">💔</div>
          <h2 className="likes-empty-title">Aucun like pour le moment</h2>
          <p className="likes-empty-text">Continuez à découvrir de nouveaux profils !</p>
          <button className="likes-empty-button" onClick={handleBack}>
            Retour à la découverte
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="likes-container">
      <div className="likes-header">
        <button className="likes-back-button" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="likes-title">Qui m'a liké</h1>
        <div className="likes-counter">{profiles.length}</div>
      </div>
      <div className="likes-grid">
        {profiles.map((profile) => (
          <ProfileThumbnail
            key={profile.id}
            image={getImageUrl(profile.images?.[0]) || ''}
            name={profile.name}
            age={profile.age}
            compatibilityScore={profile.compatibilityScoreGlobal || 0}
            distanceText={profile.location ? `📍 ${t('profile.distance', { distance: 5 })}` : undefined}
            onClick={() => handleProfileClick(profile)}
          />
        ))}
      </div>

      {selectedProfile && (
        <ProfileModal
          isOpen={true}
          onClose={handleCloseModal}
          profile={selectedProfile}
          onLike={handleLike}
        />
      )}
    </div>
  )
}
