import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ProfileCard, Modal, Button, CompatibilityListItem, CompatibilityFilter, ProfileModal, ConfirmDialog, Logo } from '@/components'
import { User, Match, DiscoverViewMode, RelationshipFilter } from '@/types'
import { useToast, useDiscoverProfiles, useConversationsStatus, useInterestedProfiles } from '@/hooks'
import { api } from '@/services/api'
import { matchingService } from '@/services/matching'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { matchingKeys } from '@/hooks/useMatching'
import parametersService from '@/services/parameters'
import './Discover.css'

export const Discover: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const { user, updateUser } = useAuth()

  const queryClient = useQueryClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [passedProfiles, setPassedProfiles] = useState<User[]>([])
  const [viewMode, setViewMode] = useState<DiscoverViewMode>('list')
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>('all')
  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; match?: Match }>({
    isOpen: false,
  })
  const [premiumModal, setPremiumModal] = useState<{ isOpen: boolean; feature: string }>({
    isOpen: false,
    feature: '',
  })
  const [profileModal, setProfileModal] = useState<{ isOpen: boolean; profile?: User }>({
    isOpen: false,
  })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [maxConversationsModal, setMaxConversationsModal] = useState<{ isOpen: boolean; maxConversations?: number }>({
    isOpen: false,
  })
  const [maxDistance, setMaxDistance] = useState(200)
  const [defaultMinCompatibility, setDefaultMinCompatibility] = useState(50)
  const [filters, setFilters] = useState({
    distance: user?.preferenceDistance || 50,
    ageMin: user?.preferenceAgeMin || 18,
    ageMax: user?.preferenceAgeMax || 50,
    minCompatibility: user?.preferenceMinCompatibility || 50
  })
  const [likingUserId, setLikingUserId] = useState<string | null>(null)

  // React Query - Charger les profils avec cache automatique
  const { data: discoverData, isLoading } = useDiscoverProfiles()
  const profiles = discoverData?.profiles || []
  const hasProfileEmbedding = discoverData?.hasProfileEmbedding ?? true

  // React Query - Statut des conversations
  const { data: conversationsStatus } = useConversationsStatus()

  // React Query - Profils intéressés (pour le compteur)
  const { data: interestedProfiles = [] } = useInterestedProfiles()
  const interestedCount = interestedProfiles.length

  useEffect(() => {
    loadMaxDistance()
  }, [])

  useEffect(() => {
    if (user) {
      setFilters({
        distance: user.preferenceDistance || 50,
        ageMin: user.preferenceAgeMin || 18,
        ageMax: user.preferenceAgeMax || 50,
        minCompatibility: user.preferenceMinCompatibility ?? defaultMinCompatibility
      })
    }
  }, [user, defaultMinCompatibility])

  const loadMaxDistance = async () => {
    try {
      const params = await parametersService.getMultiple([
        'matching.max_distance_km',
        'matching.min_compatibility_default'
      ])
      setMaxDistance(params['matching.max_distance_km'] || 200)
      setDefaultMinCompatibility(params['matching.min_compatibility_default'] || 50)
    } catch (err) {
      console.error('Error loading parameters:', err)
    }
  }

  // Fonction helper pour recharger les profils
  const reloadProfiles = () => {
    queryClient.invalidateQueries({ queryKey: matchingKeys.discover() })
  }

  const getFilteredProfiles = () => {
    let filtered = profiles

    // Filter by relationship type
    if (relationshipFilter !== 'all') {
      filtered = filtered.filter(profile => {
        const score = relationshipFilter === 'love' ? profile.compatibilityScoreLove
          : relationshipFilter === 'friendship' ? profile.compatibilityScoreFriendship
          : profile.compatibilityScoreCarnal
        return score && score >= 70
      })
    }

    // Filter by minimum compatibility
    if (filters.minCompatibility > 0) {
      filtered = filtered.filter(profile =>
        profile.compatibilityScoreGlobal && profile.compatibilityScoreGlobal >= filters.minCompatibility
      )
    }

    return filtered
  }

  const filteredProfiles = getFilteredProfiles()
  const currentProfile = filteredProfiles[currentIndex]

  const handleLike = async (userId?: string) => {
    const targetId = userId || currentProfile?.id
    if (!targetId) return

    // Check if already liked - don't prevent, let CompatibilityListItem handle it
    const profileToLike = userId ? profiles.find(p => p.id === userId) : currentProfile
    if (profileToLike?.isLiked) {
      // Already liked - the CompatibilityListItem will show the premium modal
      return
    }

    // Prevent multiple clicks on the same profile
    if (likingUserId === targetId) return

    // Vérifier si l'utilisateur peut liker avant d'appeler l'API
    if (conversationsStatus && !conversationsStatus.canLike) {
      setMaxConversationsModal({
        isOpen: true,
        maxConversations: conversationsStatus.maxConversations,
      })
      return
    }

    // Set liking state
    setLikingUserId(targetId)

    try {
      const result = await matchingService.likeProfile(targetId)
      if (result.match && result.matchData) {
        setMatchModal({ isOpen: true, match: result.matchData })
        // Invalider le cache pour recharger les profils intéressés
        queryClient.invalidateQueries({ queryKey: matchingKeys.interested() })
      } else {
        success(t('discover.like'))
      }

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: matchingKeys.conversationsStatus() })
      queryClient.invalidateQueries({ queryKey: matchingKeys.discover() })

      if (!userId) nextProfile()
    } catch (err: any) {
      // Vérifier si c'est une erreur de limite de conversations (au cas où le statut aurait changé entre temps)
      if (err.response?.data?.errorCode === 'MAX_CONVERSATIONS_REACHED') {
        setMaxConversationsModal({
          isOpen: true,
          maxConversations: err.response.data.maxConversations,
        })
        // Invalider le cache du statut
        queryClient.invalidateQueries({ queryKey: matchingKeys.conversationsStatus() })
      } else {
        showError(t('common.error'))
      }
    } finally {
      // Clear liking state after a delay to allow animation
      setTimeout(() => setLikingUserId(null), 1000)
    }
  }

  const handlePass = async (userId?: string) => {
    const targetId = userId || currentProfile?.id
    if (!targetId) return

    try {
      await matchingService.passProfile(targetId)
      if (!userId && currentProfile) {
        setPassedProfiles(prev => [...prev, currentProfile])
      }
      if (!userId) nextProfile()
    } catch (err) {
      showError(t('common.error'))
    }
  }

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      reloadProfiles()
      setCurrentIndex(0)
    }
  }

  const handleUndo = () => {
    // Fonctionnalité premium : retour en arrière
    setPremiumModal({ isOpen: true, feature: 'undo' })
  }

  const handleSuperLike = () => {
    // Fonctionnalité premium : message direct
    setPremiumModal({ isOpen: true, feature: 'directMessage' })
  }

  const handlePremiumAction = () => {
    // TODO: Rediriger vers la page de paiement/abonnement
    setPremiumModal({ isOpen: false, feature: '' })
    // navigate('/premium')
  }

  const handleCloseMatchModal = () => {
    setMatchModal({ isOpen: false })
  }

  const handleClosePremiumModal = () => {
    setPremiumModal({ isOpen: false, feature: '' })
  }

  const handleOpenProfileModal = (profile: User) => {
    if (!hasProfileEmbedding) {
      setConfirmDialogOpen(true)
      return
    }
    setProfileModal({ isOpen: true, profile })
  }

  const handleConfirmNavigate = () => {
    navigate('/alter-chat')
  }

  const handleCloseProfileModal = () => {
    setProfileModal({ isOpen: false })
  }

  const handleApplyFilters = async () => {
    try {
      // Update user preferences
      await api.put('/users/me', {
        preferenceDistance: filters.distance,
        preferenceAgeMin: filters.ageMin,
        preferenceAgeMax: filters.ageMax
      })

      // Update local user context
      updateUser({
        preferenceDistance: filters.distance,
        preferenceAgeMin: filters.ageMin,
        preferenceAgeMax: filters.ageMax,
        preferenceMinCompatibility: filters.minCompatibility
      })

      // Reload profiles with new filters
      reloadProfiles()

      setFilterModalOpen(false)
      success('Filtres appliqués')
    } catch (err) {
      showError('Erreur lors de l\'application des filtres')
    }
  }

  const handleProfileLike = () => {
    if (profileModal.profile) {
      handleLike(profileModal.profile.id)
      handleCloseProfileModal()
    }
  }

  if (isLoading) {
    return (
      <div className="discover-container">
        <div className="discover-loading">
          <div className="discover-loading-icon">
            <Logo variant="icon" size={48} />
          </div>
          <h2 className="discover-loading-title">Recherche en cours...</h2>
          <p className="discover-loading-text">
            Nous analysons les profils les plus compatibles avec vous
          </p>
          <div className="discover-loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="discover-container">
      <div className="discover-header">
        <div className="discover-header-info">
          <div className="discover-avatar">
            <Logo variant="icon" size={28} />
          </div>
          <h1 className="discover-title">{t('discover.title')}</h1>
        </div>
        <div className="discover-header-actions">
          <div className="discover-view-toggle" style={{ display: 'none' }}>
            <button
              className={`view-toggle-button ${viewMode === 'swipe' ? 'active' : ''}`}
              onClick={() => setViewMode('swipe')}
              title={t('discover.swipeMode')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title={t('discover.listMode')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {viewMode === 'list' && (
            <CompatibilityFilter
              value={relationshipFilter}
              onChange={setRelationshipFilter}
              compact
            />
          )}
          
          <button
            className="discover-header-icon-button"
            title={t('common.filters')}
            onClick={() => setFilterModalOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h18M5 8h14M8 12h8M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="discover-header-icon-button discover-header-icon-button--likes"
            title={t('common.whoLikedMe')}
            onClick={() => interestedCount > 0 && navigate('/likes')}
            disabled={interestedCount === 0}
            style={{ cursor: interestedCount === 0 ? 'not-allowed' : 'pointer', opacity: interestedCount === 0 ? 0.5 : 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="discover-header-badge">{interestedCount}</span>
          </button>
        </div>
      </div>

      <div className="discover-content">
        {conversationsStatus && !conversationsStatus.canLike && (
          <div className="discover-conversations-limit-info">
            <div className="discover-conversations-limit-emoji">🎯</div>
            <div className="discover-conversations-limit-content">
              <p className="discover-conversations-limit-text">
                {t('discover.maxConversationsReachedMessage', { max: conversationsStatus.maxConversations })}
              </p>
            </div>
          </div>
        )}
        {!currentProfile ? (
          <div className="discover-empty">
            <h2 className="discover-empty-title">{t('discover.noMoreProfiles')}</h2>
            <p className="discover-empty-text">{t('discover.comeBackLater')}</p>
            <Button variant="primary" onClick={reloadProfiles}>
              {t('common.continue')}
            </Button>
          </div>
        ) : viewMode === 'swipe' ? (
          <div className="discover-card-container">
            <ProfileCard
              name={currentProfile.name}
              age={currentProfile.age}
              bio={currentProfile.bio}
              interests={currentProfile.interests}
              images={currentProfile.images}
              distance={currentProfile.distance}
              compatibilityScoreGlobal={currentProfile.compatibilityScoreGlobal}
              compatibilityScoreLove={currentProfile.compatibilityScoreLove}
              compatibilityScoreFriendship={currentProfile.compatibilityScoreFriendship}
              compatibilityScoreCarnal={currentProfile.compatibilityScoreCarnal}
              onLike={() => handleLike()}
              onPass={() => handlePass()}
              onUndo={handleUndo}
              onDirectMessage={handleSuperLike}
              disableUndo={passedProfiles.length === 0}
              hasProfileEmbedding={hasProfileEmbedding}
            />
          </div>
        ) : (
          <div className="discover-list-container">
            {filteredProfiles.map((profile) => (
              <div key={profile.id} style={{ position: 'relative' }}>
                <CompatibilityListItem
                  user={profile}
                  onLike={() => handleLike(profile.id)}
                  onPass={() => handlePass(profile.id)}
                  onDirectMessage={handleSuperLike}
                  onGift={handleSuperLike}
                  onClick={() => handleOpenProfileModal(profile)}
                  hasProfileEmbedding={hasProfileEmbedding}
                />
                {likingUserId === profile.id && !profile.isLiked && (
                  <div className="like-hearts-animation">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="floating-heart"
                        style={{
                          left: `${30 + Math.random() * 40}%`,
                          animationDelay: `${i * 0.1}s`,
                          fontSize: `${1 + Math.random() * 1.5}rem`
                        }}
                      >
                        ❤️
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={matchModal.isOpen}
        onClose={handleCloseMatchModal}
        size="sm"
        closeOnBackdropClick={false}
      >
        <div className="match-modal">
          <div className="match-modal-icon">✨</div>
          <h2 className="match-modal-title">{t('matches.newMatch')}</h2>
          <p className="match-modal-text">
            {t('matches.matchMessage', { name: matchModal.match?.matchedUser.name })}
          </p>
          <div className="match-modal-actions">
            <button
              className="match-modal-primary-button"
              onClick={() => matchModal.match && navigate(`/chat/${matchModal.match.id}`)}
            >
              <span className="match-modal-button-icon">💬</span>
              <span className="match-modal-button-text">Envoyer un message</span>
            </button>
            <button
              className="match-modal-secondary-button"
              onClick={handleCloseMatchModal}
            >
              Continuer à découvrir
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={premiumModal.isOpen}
        onClose={handleClosePremiumModal}
        size="sm"
      >
        <div className="premium-modal">
          <div className="premium-modal-icon">👑</div>
          <h2 className="premium-modal-title">
            {premiumModal.feature === 'undo'
              ? t('premium.undoTitle')
              : t('premium.directMessageTitle')}
          </h2>
          <p className="premium-modal-text">
            {premiumModal.feature === 'undo'
              ? t('premium.undoDescription')
              : t('premium.directMessageDescription')}
          </p>
          <div className="premium-modal-features">
            <div className="premium-modal-feature">
              <span className="premium-modal-feature-icon">✓</span>
              <span>{t('premium.feature1')}</span>
            </div>
            <div className="premium-modal-feature">
              <span className="premium-modal-feature-icon">✓</span>
              <span>{t('premium.feature2')}</span>
            </div>
            <div className="premium-modal-feature">
              <span className="premium-modal-feature-icon">✓</span>
              <span>{t('premium.feature3')}</span>
            </div>
          </div>
          <div className="premium-modal-actions">
            <button
              className="premium-modal-primary-button"
              onClick={handlePremiumAction}
            >
              <span className="premium-modal-button-icon">👑</span>
              <span className="premium-modal-button-text">{t('premium.upgrade')}</span>
            </button>
            <button
              className="premium-modal-secondary-button"
              onClick={handleClosePremiumModal}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </Modal>

      {profileModal.profile && (
        <ProfileModal
          isOpen={profileModal.isOpen}
          onClose={handleCloseProfileModal}
          profile={profileModal.profile}
          onLike={handleProfileLike}
          onDirectMessage={handleSuperLike}
          onGift={handleSuperLike}
          hasProfileEmbedding={hasProfileEmbedding}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmNavigate}
        message={t('discover.noEmbeddingViewConfirm')}
        confirmText={t('discover.chatWithAlter')}
        cancelText={t('discover.notNow')}
        icon={<Logo variant="icon" size={48} />}
      />

      <Modal
        isOpen={filterModalOpen}
        onClose={() => {
          console.log('🔴 Filter modal closing')
          setFilterModalOpen(false)
        }}
        size="md"
        closeOnBackdropClick={false}
        enableSwipeToClose={false}
      >
        <div className="filter-modal">
          <h2 className="filter-modal-title">Filtres de recherche</h2>

          <div className="filter-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="filter-item">
              <label className="filter-label">
                Distance maximale: {filters.distance} km
              </label>
              <input
                type="range"
                min="5"
                max={maxDistance}
                value={filters.distance}
                onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="filter-slider"
              />
            </div>

            <div className="filter-item">
              <label className="filter-label">
                Âge: {filters.ageMin} - {filters.ageMax} ans
              </label>
              <div className="filter-dual-range">
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={filters.ageMin}
                  onChange={(e) => {
                    const min = parseInt(e.target.value)
                    if (min <= filters.ageMax) {
                      setFilters({ ...filters, ageMin: min })
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={filters.ageMax}
                  onChange={(e) => {
                    const max = parseInt(e.target.value)
                    if (max >= filters.ageMin) {
                      setFilters({ ...filters, ageMax: max })
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
                <div
                  className="filter-dual-range-track"
                  style={{
                    left: `${(filters.ageMin - 18) / (99 - 18) * 100}%`,
                    right: `${100 - (filters.ageMax - 18) / (99 - 18) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="filter-item">
              <label className="filter-label">
                Compatibilité minimale: {filters.minCompatibility}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.minCompatibility}
                onChange={(e) => setFilters({ ...filters, minCompatibility: parseInt(e.target.value) })}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="filter-slider"
              />
            </div>
          </div>

          <div className="filter-modal-actions">
            <Button variant="ghost" onClick={() => setFilterModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleApplyFilters}>
              Appliquer
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={maxConversationsModal.isOpen}
        onClose={() => setMaxConversationsModal({ isOpen: false })}
        onConfirm={() => {
          setMaxConversationsModal({ isOpen: false })
          navigate('/matches')
        }}
        title={t('discover.maxConversationsReachedTitle')}
        message={t('discover.maxConversationsReachedMessage', { max: maxConversationsModal.maxConversations || 5 })}
        confirmText={t('discover.goToConversations')}
        cancelText={t('common.cancel')}
        icon="💬"
      />
    </div>
  )
}