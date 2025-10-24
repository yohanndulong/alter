import React from 'react'
import { useTranslation } from 'react-i18next'
import './LoadingMoreIndicator.css'

interface LoadingMoreIndicatorProps {
  text?: string
}

export const LoadingMoreIndicator: React.FC<LoadingMoreIndicatorProps> = ({ text }) => {
  const { t } = useTranslation()
  const displayText = text || t('chat.loadingMore')

  return (
    <div className="loading-more-indicator">
      <div className="loading-more-spinner">
        <div className="loading-more-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <span className="loading-more-text">{displayText}</span>
    </div>
  )
}
