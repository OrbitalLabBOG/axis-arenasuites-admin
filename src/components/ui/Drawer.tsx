import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-[var(--paper-soft)] shadow-[0_30px_80px_-30px_rgba(var(--shadow),0.65)] transition-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-start justify-between border-b border-black/10 px-6 pb-4 pt-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Detalle</p>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">{title}</h2>
            {subtitle ? <p className="text-sm text-[var(--ink-muted)]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white/80 p-2 text-[var(--ink-muted)] transition hover:border-black/20 hover:text-[var(--ink)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-black/10 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}
