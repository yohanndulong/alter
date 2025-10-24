import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import './ConfirmDialog.css'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  icon?: React.ReactNode
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  customActions?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  icon,
  secondaryAction,
  customActions,
}) => {
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="confirm-dialog">
        {icon && <div className="confirm-dialog__icon">{icon}</div>}
        {title && <h2 className="confirm-dialog__title">{title}</h2>}
        <p className="confirm-dialog__message">{message}</p>
        {customActions ? (
          <div className="confirm-dialog__custom-actions">
            {customActions}
          </div>
        ) : (
          <div className="confirm-dialog__actions">
            {secondaryAction && (
              <Button variant="ghost" onClick={secondaryAction.onClick} className="confirm-dialog__button">
                {secondaryAction.label}
              </Button>
            )}
            <div className="confirm-dialog__actions-main">
              <Button variant="secondary" onClick={onClose} className="confirm-dialog__button">
                {cancelText}
              </Button>
              <Button variant="primary" onClick={handleConfirm} className="confirm-dialog__button">
                {confirmText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
