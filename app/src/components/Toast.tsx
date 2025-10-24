import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  useEffect(() => {
    // Si une action est présente, ne pas auto-fermer
    if (action) return

    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose, action])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__message">{message}</span>
      {action && (
        <button
          className="toast__action"
          onClick={() => {
            action.onClick()
            onClose(id)
          }}
        >
          {action.label}
        </button>
      )}
      <button className="toast__close" onClick={() => onClose(id)}>
        ✕
      </button>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    message: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }>
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  )
}