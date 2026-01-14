import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'xs' | 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--teal)] text-white shadow-[0_12px_25px_-18px_rgba(var(--shadow),0.6)] hover:bg-[var(--teal-strong)]',
  secondary:
    'border border-black/10 bg-white/85 text-[var(--ink-muted)] hover:border-black/20 hover:text-[var(--ink)]',
  ghost: 'border border-black/10 bg-[var(--paper-soft)] text-[var(--ink-muted)] hover:text-[var(--ink)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-3 py-2 text-[0.65rem] uppercase tracking-[0.2em]',
  sm: 'px-4 py-2 text-xs uppercase tracking-[0.2em]',
  md: 'px-5 py-3 text-sm font-semibold',
}

export function Button({ variant = 'secondary', size = 'sm', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
