import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCounter = 0

// Global toast state for use outside React components
let globalAddToast: ((message: string, type?: ToastType, duration?: number) => void) | null = null

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${++toastCounter}`
    const newToast: Toast = { id, message, type, duration }
    
    setState(prev => ({
      toasts: [...prev.toasts, newToast]
    }))

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setState(prev => ({
      toasts: prev.toasts.filter(t => t.id !== id)
    }))
  }, [])

  // Register the global addToast function
  globalAddToast = addToast

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  }
}

// Export a function that can be used outside React components
export function toast(message: string, type: ToastType = 'info', duration = 3000) {
  if (globalAddToast) {
    globalAddToast(message, type, duration)
  } else {
    // Fallback to console if toast system not initialized
    console.log(`[Toast ${type}]: ${message}`)
  }
}

toast.success = (message: string, duration?: number) => toast(message, 'success', duration)
toast.error = (message: string, duration?: number) => toast(message, 'error', duration)
toast.info = (message: string, duration?: number) => toast(message, 'info', duration)
toast.warning = (message: string, duration?: number) => toast(message, 'warning', duration)

