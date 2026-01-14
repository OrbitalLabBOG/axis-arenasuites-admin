import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { DemoNotice } from '@/components/common/DemoNotice'
import {
  addMonths,
  formatCurrency,
  formatDateKey,
  formatPercentage,
  formatShortDate,
  getDaysInMonth,
  getMonthKey,
  parseDateKey,
} from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'

type MonthlyKpiRow = Pick<
  Tables<'monthly_kpis'>,
  'month' | 'total_nights_sold' | 'total_revenue' | 'revenue_without_tax' | 'total_bookings'
>

type BookingSummaryRow = Pick<
  Tables<'booking_summary'>,
  | 'id'
  | 'guest_name'
  | 'apartment_number'
  | 'channel_name'
  | 'check_in_date'
  | 'check_out_date'
  | 'status'
  | 'balance_due'
>

interface KpiAggregate {
  totalRevenue: number
  revenueWithoutTax: number
  totalNights: number
  totalBookings: number
  occupancyRate: number
  adr: number
  revpar: number
}

interface ArrivalItem {
  guest: string
  room: string
  date: string
  channel: string
}

interface DepartureItem {
  guest: string
  room: string
  date: string
  status: string
}

interface KpiCard {
  label: string
  value: string
  helper?: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'flat'
  accent?: 'teal' | 'amber' | 'navy' | 'coral'
}

const demoKpis = [
  {
    label: 'Ocupacion',
    value: '78%',
    helper: '22/28 habitaciones',
    trend: '+6% vs mes anterior',
    trendDirection: 'up' as const,
    accent: 'teal' as const,
  },
  {
    label: 'ADR',
    value: '$310.000',
    helper: 'Tarifa promedio',
    trend: '+3% vs mes anterior',
    trendDirection: 'up' as const,
    accent: 'navy' as const,
  },
  {
    label: 'RevPAR',
    value: '$242.000',
    helper: 'Ingreso por habitacion',
    trend: '+1.8% vs mes anterior',
    trendDirection: 'up' as const,
    accent: 'amber' as const,
  },
  {
    label: 'Ingresos mes',
    value: '$4.9M',
    helper: 'Corte mensual',
    trend: '+12% vs mes anterior',
    trendDirection: 'up' as const,
    accent: 'coral' as const,
  },
]

const demoArrivals = [
  { guest: 'Valentina Mora', room: '203', date: 'Hoy', channel: 'Booking' },
  { guest: 'Daniel Silva', room: '210', date: 'Hoy', channel: 'Directo' },
  { guest: 'Maria Lopez', room: '305', date: 'Hoy', channel: 'Expedia' },
]

const demoDepartures = [
  { guest: 'Carlos Rios', room: '201', date: 'Hoy', status: 'Pagado' },
  { guest: 'Natalia Torres', room: '312', date: 'Hoy', status: 'Pendiente' },
]

const alerts = [
  { label: 'Pago pendiente', detail: 'Reserva AS-1023 · 201' },
  { label: 'Check-in sin completar', detail: 'Reserva AS-1041 · 307' },
  { label: 'Habitacion sin asignar', detail: 'Reserva AS-1045 · 2 noches' },
]

const tasks = [
  { title: 'Confirmar late check-out', detail: 'Habitacion 214 · 30 min' },
  { title: 'Registrar deposito', detail: 'Reserva AS-1048 · COP 450.000' },
  { title: 'Cerrar caja', detail: 'Turno manana' },
]

const ROOMS_TOTAL = 28

function aggregateKpis(rows: MonthlyKpiRow[], monthKey: string): KpiAggregate {
  const totalRevenue = rows.reduce((sum, row) => sum + (row.total_revenue ?? 0), 0)
  const revenueWithoutTax = rows.reduce((sum, row) => sum + (row.revenue_without_tax ?? 0), 0)
  const totalNights = rows.reduce((sum, row) => sum + (row.total_nights_sold ?? 0), 0)
  const totalBookings = rows.reduce((sum, row) => sum + (row.total_bookings ?? 0), 0)

  const monthDate = parseDateKey(monthKey) ?? new Date()
  const daysInMonth = getDaysInMonth(monthDate)
  const roomsAvailable = ROOMS_TOTAL * daysInMonth

  const occupancyRate = roomsAvailable > 0 ? (totalNights / roomsAvailable) * 100 : 0
  const adr = totalNights > 0 ? totalRevenue / totalNights : 0
  const revpar = roomsAvailable > 0 ? totalRevenue / roomsAvailable : 0

  return {
    totalRevenue,
    revenueWithoutTax,
    totalNights,
    totalBookings,
    occupancyRate,
    adr,
    revpar,
  }
}

function calculateTrend(current: number, previous: number): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return { text: '—', direction: 'flat' }
  }
  const diff = ((current - previous) / Math.abs(previous)) * 100
  if (diff === 0) {
    return { text: '0.0% vs mes anterior', direction: 'flat' }
  }
  const direction = diff > 0 ? 'up' : 'down'
  const sign = diff > 0 ? '+' : ''
  return { text: `${sign}${diff.toFixed(1)}% vs mes anterior`, direction }
}

function mapArrivals(rows: BookingSummaryRow[], todayKey: string): ArrivalItem[] {
  return rows
    .filter((row) => row.check_in_date === todayKey && row.status !== 'CANCELLED')
    .map((row) => ({
      guest: row.guest_name ?? 'Sin huesped',
      room: row.apartment_number ?? '-',
      date: formatShortDate(row.check_in_date),
      channel: row.channel_name ?? 'Sin canal',
    }))
}

function mapDepartures(rows: BookingSummaryRow[], todayKey: string): DepartureItem[] {
  return rows
    .filter((row) => row.check_out_date === todayKey && row.status !== 'CANCELLED')
    .map((row) => ({
      guest: row.guest_name ?? 'Sin huesped',
      room: row.apartment_number ?? '-',
      date: formatShortDate(row.check_out_date),
      status: row.balance_due && row.balance_due > 0 ? 'Pendiente' : 'Pagado',
    }))
}

export function DashboardPage() {
  const { pushToast } = useToast()
  const useDemoData = !isSupabaseConfigured
  const todayKey = formatDateKey(new Date())
  const currentMonthKey = getMonthKey(new Date())
  const previousMonthKey = getMonthKey(addMonths(new Date(), -1))

  const {
    data: kpiRows,
    isLoading: isKpiLoading,
    isError: isKpiError,
  } = useQuery({
    queryKey: ['monthly-kpis', currentMonthKey, previousMonthKey],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return []
      }
      const { data, error } = await supabase
        .from('monthly_kpis')
        .select('month,total_nights_sold,total_revenue,revenue_without_tax,total_bookings')
        .in('month', [currentMonthKey, previousMonthKey])

      if (error) {
        throw error
      }

      return (data ?? []) as MonthlyKpiRow[]
    },
  })

  const {
    data: dayBookings,
    isLoading: isDayLoading,
    isError: isDayError,
  } = useQuery({
    queryKey: ['dashboard-day-bookings', todayKey],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return []
      }
      const { data, error } = await supabase
        .from('booking_summary')
        .select(
          [
            'id',
            'guest_name',
            'apartment_number',
            'channel_name',
            'check_in_date',
            'check_out_date',
            'status',
            'balance_due',
          ].join(',')
        )
        .or(`check_in_date.eq.${todayKey},check_out_date.eq.${todayKey}`)
        .order('check_in_date', { ascending: true })

      if (error) {
        throw error
      }

      return (data ?? []) as unknown as BookingSummaryRow[]
    },
  })

  const kpiCards = useMemo<KpiCard[]>(() => {
    if (useDemoData) {
      return demoKpis
    }
    const rows = kpiRows ?? []
    if (rows.length === 0) {
      return [
        { label: 'Ocupacion', value: '—', helper: 'Sin datos', accent: 'teal' as const },
        { label: 'ADR', value: '—', helper: 'Sin datos', accent: 'navy' as const },
        { label: 'RevPAR', value: '—', helper: 'Sin datos', accent: 'amber' as const },
        { label: 'Ingresos mes', value: '—', helper: 'Sin datos', accent: 'coral' as const },
      ]
    }

    const currentRows = rows.filter((row) => row.month === currentMonthKey)
    const previousRows = rows.filter((row) => row.month === previousMonthKey)
    const current = aggregateKpis(currentRows, currentMonthKey)
    const previous = aggregateKpis(previousRows, previousMonthKey)

    const occupancyTrend = calculateTrend(current.occupancyRate, previous.occupancyRate)
    const adrTrend = calculateTrend(current.adr, previous.adr)
    const revparTrend = calculateTrend(current.revpar, previous.revpar)
    const revenueTrend = calculateTrend(current.totalRevenue, previous.totalRevenue)

    return [
      {
        label: 'Ocupacion',
        value: formatPercentage(current.occupancyRate),
        helper: `${current.totalNights} noches vendidas`,
        trend: occupancyTrend.text,
        trendDirection: occupancyTrend.direction,
        accent: 'teal' as const,
      },
      {
        label: 'ADR',
        value: formatCurrency(current.adr),
        helper: 'Tarifa promedio',
        trend: adrTrend.text,
        trendDirection: adrTrend.direction,
        accent: 'navy' as const,
      },
      {
        label: 'RevPAR',
        value: formatCurrency(current.revpar),
        helper: 'Ingreso por habitacion',
        trend: revparTrend.text,
        trendDirection: revparTrend.direction,
        accent: 'amber' as const,
      },
      {
        label: 'Ingresos mes',
        value: formatCurrency(current.totalRevenue),
        helper: `Sin impuestos ${formatCurrency(current.revenueWithoutTax)}`,
        trend: revenueTrend.text,
        trendDirection: revenueTrend.direction,
        accent: 'coral' as const,
      },
    ]
  }, [currentMonthKey, kpiRows, previousMonthKey, useDemoData])

  const arrivals = useMemo(() => {
    if (useDemoData) {
      return demoArrivals
    }
    return mapArrivals(dayBookings ?? [], todayKey)
  }, [dayBookings, todayKey, useDemoData])

  const departures = useMemo(() => {
    if (useDemoData) {
      return demoDepartures
    }
    return mapDepartures(dayBookings ?? [], todayKey)
  }, [dayBookings, todayKey, useDemoData])

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Operacion diaria"
        title="Resumen operativo"
        description="Todo lo que necesitas para coordinar check-ins, salidas y alertas del dia."
        actions={
          <>
            <div className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Turno 07:00 - 15:00
            </div>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Caja abierta',
                  description: 'Turno activo para registrar movimientos.',
                  variant: 'success',
                })
              }
            >
              Abrir caja
            </Button>
          </>
        }
      />

      {useDemoData ? <DemoNotice label="Dashboard" /> : null}
      {!useDemoData && isKpiLoading ? (
        <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
          Cargando indicadores...
        </Card>
      ) : null}
      {!useDemoData && isKpiError ? (
        <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
          No se pudieron cargar los indicadores.
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            helper={kpi.helper}
            trend={kpi.trend}
            trendDirection={kpi.trendDirection}
            accent={kpi.accent}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Llegadas</p>
                <h3 className="text-xl font-semibold text-[var(--ink)]">Check-ins hoy</h3>
              </div>
              <Badge variant="available">{arrivals.length} previstos</Badge>
            </div>
            <div className="space-y-3">
              {useDemoData ? (
                arrivals.map((arrival) => (
                  <div
                    key={arrival.guest}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{arrival.guest}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Habitacion {arrival.room} · {arrival.channel}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--teal)]">{arrival.date}</span>
                  </div>
                ))
              ) : isDayLoading ? (
                <p className="text-sm text-[var(--ink-muted)]">Cargando llegadas...</p>
              ) : isDayError ? (
                <p className="text-sm text-[var(--ink-muted)]">No se pudieron cargar las llegadas.</p>
              ) : arrivals.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No hay check-ins previstos hoy.</p>
              ) : (
                arrivals.map((arrival) => (
                  <div
                    key={`${arrival.guest}-${arrival.room}`}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{arrival.guest}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Habitacion {arrival.room} · {arrival.channel}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--teal)]">{arrival.date}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Salidas</p>
                <h3 className="text-xl font-semibold text-[var(--ink)]">Check-outs hoy</h3>
              </div>
              <Badge variant="warning">{departures.length} pendientes</Badge>
            </div>
            <div className="space-y-3">
              {useDemoData ? (
                departures.map((departure) => (
                  <div
                    key={departure.guest}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{departure.guest}</p>
                      <p className="text-xs text-[var(--ink-muted)]">Habitacion {departure.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[var(--amber)]">{departure.date}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        {departure.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : isDayLoading ? (
                <p className="text-sm text-[var(--ink-muted)]">Cargando salidas...</p>
              ) : isDayError ? (
                <p className="text-sm text-[var(--ink-muted)]">No se pudieron cargar las salidas.</p>
              ) : departures.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No hay check-outs previstos hoy.</p>
              ) : (
                departures.map((departure) => (
                  <div
                    key={`${departure.guest}-${departure.room}`}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{departure.guest}</p>
                      <p className="text-xs text-[var(--ink-muted)]">Habitacion {departure.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[var(--amber)]">{departure.date}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        {departure.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card tone="soft" className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Alertas</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Prioridades del turno</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.detail}
                  className="rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                >
                  <p className="font-semibold text-[var(--ink)]">{alert.label}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{alert.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas del turno</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Pendientes clave</h3>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-4 text-sm"
                >
                  <p className="font-semibold text-[var(--ink)]">{task.title}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{task.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
