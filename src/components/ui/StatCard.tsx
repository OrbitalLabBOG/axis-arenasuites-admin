import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  helper?: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'flat'
  accent?: 'teal' | 'amber' | 'navy' | 'coral'
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
  teal: 'text-[var(--teal)]',
  amber: 'text-[var(--amber)]',
  navy: 'text-[var(--navy)]',
  coral: 'text-[var(--coral)]',
}

const trendIcons: Record<NonNullable<StatCardProps['trendDirection']>, ReactNode> = {
  up: <ArrowUpRight className="h-3.5 w-3.5" />,
  down: <ArrowDownRight className="h-3.5 w-3.5" />,
  flat: <Minus className="h-3.5 w-3.5" />,
}

export function StatCard({
  label,
  value,
  helper,
  trend,
  trendDirection = 'flat',
  accent = 'teal',
}: StatCardProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-black/10 bg-white/85 p-4 shadow-[0_18px_40px_-30px_rgba(var(--shadow),0.45)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={cn('text-2xl font-semibold', accentStyles[accent])}>{value}</p>
        {trend ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-soft)]">
            {trendIcons[trendDirection]}
            {trend}
          </span>
        ) : null}
      </div>
      {helper ? <p className="text-xs text-[var(--ink-muted)]">{helper}</p> : null}
    </div>
  )
}
