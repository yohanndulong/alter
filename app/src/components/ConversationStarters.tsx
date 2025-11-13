import React from 'react'
import { useTranslation } from 'react-i18next'
import './ConversationStarters.css'

export interface Suggestion {
  id: string
  message: string
  source: 'ai' | 'common_interests' | 'predefined'
}

export interface ConversationStartersProps {
  suggestions: Suggestion[]
  commonGround?: string
  isLoading?: boolean
  onSuggestionClick?: (message: string) => void
  onRefresh?: () => void
}

export const ConversationStarters: React.FC<ConversationStartersProps> = ({
  suggestions,
  commonGround,
  isLoading = false,
  onRefresh,
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="conversation-starters">
        <div className="conversation-starters__header">
          <div>
            <span className="conversation-starters__icon">💡</span>
            <h3 className="conversation-starters__title">{t('chat.conversationStarters.title')}</h3>
          </div>
        </div>
        <div className="conversation-starters__loading">
          <div className="conversation-starters__spinner" />
          <p>{t('chat.conversationStarters.loading')}</p>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  const getIconForIndex = (index: number) => {
    const icons = ['🤝', '💝', '🎯', '✨']
    return icons[index % icons.length]
  }

  return (
    <div className="conversation-starters">
      <div className="conversation-starters__header">
        <div>
          <span className="conversation-starters__icon">💡</span>
          <h3 className="conversation-starters__title">{t('chat.conversationStarters.title')}</h3>
        </div>
        {onRefresh && (
          <button
            className="conversation-starters__refresh"
            onClick={onRefresh}
            title={t('chat.conversationStarters.refresh')}
          >
            ↻
          </button>
        )}
      </div>

      <div className="conversation-starters__list">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className="conversation-starter"
          >
            <span className="conversation-starter__icon">{getIconForIndex(index)}</span>
            <span className="conversation-starter__message">{suggestion.message}</span>
          </div>
        ))}
      </div>

      {commonGround && (
        <p className="conversation-starters__hint">
          {t('chat.conversationStarters.basedOn')}: {commonGround}
        </p>
      )}
    </div>
  )
}
