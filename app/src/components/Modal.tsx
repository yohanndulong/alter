import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  closeOnBackdropClick?: boolean
  enableSwipeToClose?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  enableSwipeToClose = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const scrollTopAtTouchStart = useRef(0)

  // Bloquer le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Gérer la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Gérer le bouton retour du navigateur/mobile
  useEffect(() => {
    if (!isOpen) return

    // Pusher un état dans l'historique quand la modale s'ouvre
    const modalId = `modal-${Date.now()}`
    window.history.pushState({ modalId }, '')

    const handlePopState = (event: PopStateEvent) => {
      // Si on revient en arrière et que la modale est ouverte, la fermer
      if (isOpen) {
        onClose()
        // Empêcher la navigation en repoussant l'état
        window.history.pushState({ modalId }, '')
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Nettoyer l'historique si la modale se ferme normalement
      if (window.history.state?.modalId === modalId) {
        window.history.back()
      }
    }
  }, [isOpen, onClose])

  // Gestion du swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeToClose) return

    const modalElement = modalRef.current
    if (!modalElement) return

    // Récupérer l'élément scrollable (si c'est le contenu de la modale)
    const contentElement = modalElement.querySelector('.modal__content')
    const scrollTop = contentElement?.scrollTop || 0

    touchStartY.current = e.touches[0].clientY
    scrollTopAtTouchStart.current = scrollTop

    // Ne commencer le drag que si on est en haut du scroll
    if (scrollTop === 0) {
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeToClose || !isDragging) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current

    // Ne permettre que le swipe vers le bas
    if (diff > 0) {
      setDragOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    if (!enableSwipeToClose || !isDragging) return

    setIsDragging(false)

    // Si le drag est supérieur à 150px, fermer la modale
    if (dragOffset > 150) {
      onClose()
    }

    // Réinitialiser l'offset avec animation
    setDragOffset(0)
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      e.stopPropagation()
      onClose()
    }
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  // Style pour le drag
  const modalStyle: React.CSSProperties = {
    transform: `translateY(${dragOffset}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    opacity: isDragging ? Math.max(0.5, 1 - dragOffset / 500) : 1,
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={modalStyle}
      >
        {/* Indicateur de swipe (petit trait en haut sur mobile) */}
        {enableSwipeToClose && (
          <div className="modal__swipe-indicator" />
        )}

        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <button className="modal__close" onClick={handleCloseClick}>
              ✕
            </button>
          </div>
        )}
        {!title && (
          <button className="modal__close modal__close--absolute" onClick={handleCloseClick}>
            ✕
          </button>
        )}
        <div className="modal__content">{children}</div>
      </div>
    </div>,
    document.body
  )
}