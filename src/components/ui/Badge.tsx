import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'info'
  | 'warning'
  | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-black/5 text-[var(--ink-muted)]',
  available: 'bg-[rgba(47,122,109,0.15)] text-[var(--status-available)]',
  occupied: 'bg-[rgba(30,75,99,0.16)] text-[var(--status-occupied)]',
  cleaning: 'bg-[rgba(198,139,43,0.18)] text-[var(--status-cleaning)]',
  maintenance: 'bg-[rgba(180,99,84,0.18)] text-[var(--status-maintenance)]',
  info: 'bg-[rgba(15,93,94,0.15)] text-[var(--teal-strong)]',
  warning: 'bg-[rgba(217,164,65,0.2)] text-[var(--amber)]',
  danger: 'bg-[rgba(217,124,100,0.2)] text-[var(--coral)]',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em]',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
