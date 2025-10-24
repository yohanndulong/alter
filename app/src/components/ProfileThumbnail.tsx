import React from 'react'
import { CachedImage } from './CachedImage'
import './ProfileThumbnail.css'

export interface ProfileThumbnailProps {
  image: string
  name: string
  age: number
  compatibilityScore: number
  distanceText?: string
  badge?: number
  onClick?: () => void
}

export const ProfileThumbnail: React.FC<ProfileThumbnailProps> = ({
  image,
  name,
  age,
  compatibilityScore,
  distanceText,
  badge,
  onClick,
}) => {
  return (
    <div className="profile-thumbnail" onClick={onClick}>
      <div className="profile-thumbnail__image-container">
        <CachedImage
          src={image}
          alt={name}
          className="profile-thumbnail__image"
        />
        {badge !== undefined && badge > 0 && (
          <div className="profile-thumbnail__badge">{badge}</div>
        )}
        <div className="profile-thumbnail__compatibility">
          <span className="profile-thumbnail__compatibility-icon">🌍</span>
          <span className="profile-thumbnail__compatibility-value">
            {compatibilityScore}%
          </span>
        </div>
        <div className="profile-thumbnail__info">
          <h3 className="profile-thumbnail__name">{name}, {age}</h3>
          {distanceText && (
            <p className="profile-thumbnail__distance">{distanceText}</p>
          )}
        </div>
      </div>
    </div>
  )
}
