import { useState, useCallback } from 'react'
import { ToastType } from '@/components'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number, action?: { label: string; onClick: () => void }) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const toast: Toast = { id, type, message, duration, action }
      setToasts(prev => [...prev, toast])
      return id
    },
    []
  )

  const showToast = useCallback(
    (params: { type: ToastType; message: string; duration?: number; action?: { label: string; onClick: () => void } }) => {
      return addToast(params.type, params.message, params.duration, params.action)
    },
    [addToast]
  )

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => addToast('success', message, duration),
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => addToast('error', message, duration),
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => addToast('warning', message, duration),
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => addToast('info', message, duration),
    [addToast]
  )

  return {
    toasts,
    removeToast,
    showToast,
    success,
    error,
    warning,
    info,
  }
}