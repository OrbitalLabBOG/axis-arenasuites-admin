import type { ReactNode } from 'react'

interface PageHeaderProps {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {kicker ? (
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">{kicker}</p>
        ) : null}
        <h1 className="text-3xl font-semibold text-[var(--ink)] md:text-4xl">{title}</h1>
        {description ? <p className="max-w-xl text-sm text-[var(--ink-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}
