import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'soft'
}

const toneStyles: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-white/85',
  soft: 'bg-[var(--paper-soft)]/80',
}

export function Card({ tone = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-black/10 p-5 shadow-[0_18px_40px_-30px_rgba(var(--shadow),0.5)]',
        toneStyles[tone],
        className
      )}
      {...props}
    />
  )
}
