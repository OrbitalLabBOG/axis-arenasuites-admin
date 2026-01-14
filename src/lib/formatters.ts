export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function parseCurrency(value?: string | number | null): number {
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === 'number') {
    return value
  }
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(value?: string | null): Date | null {
  if (!value) {
    return null
  }
  if (value.includes('T')) {
    return new Date(value)
  }
  return new Date(`${value}T00:00:00`)
}

export function formatShortDate(value?: string | null): string {
  const date = parseDateKey(value)
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatDayLabel(value?: string | null): string {
  const date = parseDateKey(value)
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
  }).format(date)
}

export function formatLongDate(value?: string | null): string {
  const date = parseDateKey(value)
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function diffInDays(start?: string | null, end?: string | null): number {
  const startDate = parseDateKey(start)
  const endDate = parseDateKey(end)
  if (!startDate || !endDate) {
    return 0
  }
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

export function getWeekRange(baseDate: Date): { start: string; end: string; label: string } {
  const date = new Date(baseDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const startDate = new Date(date)
  startDate.setDate(date.getDate() + diffToMonday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  const startKey = formatDateKey(startDate)
  const endKey = formatDateKey(endDate)
  const label = `${formatShortDate(startKey)} - ${formatShortDate(endKey)}`

  return { start: startKey, end: endKey, label }
}

export function addDays(baseDate: Date, amount: number): Date {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + amount)
  return date
}

export function addMonths(baseDate: Date, amount: number): Date {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + amount, 1)
}

export function getMonthKey(date: Date): string {
  return formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function formatPercentage(value?: number | null, precision = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return `${value.toFixed(precision)}%`
}
