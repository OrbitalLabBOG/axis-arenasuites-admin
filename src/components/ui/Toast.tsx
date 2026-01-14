import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-[rgba(47,122,109,0.4)] bg-[rgba(47,122,109,0.12)] text-[var(--status-available)]',
  info: 'border-[rgba(15,93,94,0.3)] bg-[rgba(15,93,94,0.1)] text-[var(--teal-strong)]',
  warning: 'border-[rgba(217,164,65,0.35)] bg-[rgba(217,164,65,0.12)] text-[var(--amber)]',
  danger: 'border-[rgba(217,124,100,0.35)] bg-[rgba(217,124,100,0.12)] text-[var(--coral)]',
}

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = createToastId()
      setToasts((prev) => [...prev, { id, ...toast }])
      window.setTimeout(() => removeToast(id), 3500)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-6 top-6 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'rise-in flex items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm text-[var(--ink)] shadow-[0_18px_35px_-24px_rgba(var(--shadow),0.45)]',
              variantStyles[toast.variant]
            )}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-current" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-[var(--ink)]">{toast.title}</p>
              {toast.description ? (
                <p className="text-xs text-[var(--ink-muted)]">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-full border border-transparent p-1 text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
