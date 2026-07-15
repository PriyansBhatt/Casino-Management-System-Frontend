import { createContext, useCallback, useMemo, useState } from 'react'
import Toast from '../components/ui/Toast'

export const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const toast = { id, type, title, message }

      setToasts((current) => [toast, ...current].slice(0, 5))

      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration)
      }

      return id
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
    }),
    [removeToast, showToast, toasts]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
