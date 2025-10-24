import React from 'react'
import { useTranslation } from 'react-i18next'
import './Badge.css'

export interface BadgeProps {
  count: number
  max?: number // Maximum à afficher, au-delà affiche "99+"
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'error' | 'primary' | 'success' | 'warning'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  max = 99,
  position = 'top-right',
  size = 'md',
  variant = 'error',
  className = ''
}) => {
  const { t } = useTranslation()

  // Ne rien afficher si count est 0
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <div
      className={`badge badge--${position} badge--${size} badge--${variant} ${className}`}
      aria-label={t('chat.unreadCount', { count })}
    >
      {displayCount}
    </div>
  )
}
