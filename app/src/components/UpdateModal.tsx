import React from 'react'
import { useTranslation } from 'react-i18next'
import './UpdateModal.css'

interface UpdateModalProps {
  version: string
  notes?: string
  onUpdate: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ version, notes, onUpdate }) => {
  const { t } = useTranslation()

  return (
    <div className="update-modal-overlay">
      <div className="update-modal">
        <div className="update-modal-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="url(#updateGradient)" strokeWidth="4" />
            <path
              d="M40 20V40L50 30M40 40L30 30"
              stroke="url(#updateGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25 50C25 50 28 60 40 60C52 60 55 50 55 50"
              stroke="url(#updateGradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="updateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary-500)" />
                <stop offset="100%" stopColor="var(--color-secondary-500)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="update-modal-title">{t('update.newVersionAvailable')}</h2>

        <div className="update-modal-version">
          <span className="update-modal-version-label">{t('update.version')}</span>
          <span className="update-modal-version-number">{version}</span>
        </div>

        {notes && (
          <div className="update-modal-notes">
            <p className="update-modal-notes-title">{t('update.whatsNew')}</p>
            <p className="update-modal-notes-content">{notes}</p>
          </div>
        )}

        <p className="update-modal-description">
          {t('update.description')}
        </p>

        <button className="update-modal-button" onClick={onUpdate}>
          <span>{t('update.updateNow')}</span>
          <span className="update-modal-button-icon">→</span>
        </button>
      </div>
    </div>
  )
}
