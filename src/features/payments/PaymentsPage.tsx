import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { DemoNotice } from '@/components/common/DemoNotice'
import { formatCurrency, formatLongDate, parseCurrency } from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'
import { payments as demoPayments, type Payment as DemoPayment } from './paymentsData'

export type PaymentStatus = 'recibido' | 'pendiente' | 'reembolsado'

interface PaymentListItem {
  id: string
  bookingId: string
  booking: string
  guest: string
  date: string
  dateValue: string | null
  method: string
  channel: string
  amount: string
  amountValue: number
  status: PaymentStatus
  notes?: string | null
}

type PaymentRow = Pick<
  Tables<'payments'>,
  'id' | 'amount' | 'payment_date' | 'payment_method' | 'notes' | 'booking_id' | 'created_at'
> & {
  booking_summary?: Pick<Tables<'booking_summary'>, 'booking_reference' | 'guest_name' | 'channel_name'> | null
}

type BookingOption = Pick<Tables<'booking_summary'>, 'id' | 'booking_reference' | 'guest_name'>

interface PaymentFormState {
  bookingId: string
  amount: string
  paymentMethod: string
  paymentDate: string
  notes: string
}

const emptyPaymentForm: PaymentFormState = {
  bookingId: '',
  amount: '',
  paymentMethod: 'CASH',
  paymentDate: '',
  notes: '',
}

const statusMeta: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  recibido: { label: 'Recibido', variant: 'available' },
  pendiente: { label: 'Pendiente', variant: 'warning' },
  reembolsado: { label: 'Reembolsado', variant: 'danger' },
}

const allStatuses: PaymentStatus[] = ['recibido', 'pendiente', 'reembolsado']

function mapPaymentMethod(method?: string | null): string {
  switch (method) {
    case 'CASH':
      return 'Efectivo'
    case 'CARD':
      return 'Tarjeta'
    case 'TRANSFER':
      return 'Transferencia'
    case 'ONLINE':
      return 'Online'
    default:
      return 'Sin metodo'
  }
}

function mapPaymentStatus(payment: PaymentRow): PaymentStatus {
  const notes = payment.notes?.toLowerCase() ?? ''
  if (notes.includes('reembolso') || notes.includes('refund')) {
    return 'reembolsado'
  }
  if (payment.payment_date) {
    return 'recibido'
  }
  return 'pendiente'
}

function mapPaymentRow(row: PaymentRow): PaymentListItem {
  const amountValue = row.amount ?? 0
  const bookingReference = row.booking_summary?.booking_reference ?? row.booking_id
  const guest = row.booking_summary?.guest_name ?? 'Sin huesped'
  const channel = row.booking_summary?.channel_name ?? 'Sin canal'

  return {
    id: row.id,
    bookingId: row.booking_id,
    booking: bookingReference,
    guest,
    date: formatLongDate(row.payment_date ?? row.created_at),
    dateValue: row.payment_date ?? row.created_at ?? null,
    method: mapPaymentMethod(row.payment_method),
    channel,
    amount: formatCurrency(amountValue),
    amountValue,
    status: mapPaymentStatus(row),
    notes: row.notes,
  }
}

function mapDemoPayment(payment: DemoPayment): PaymentListItem {
  const amountValue = parseCurrency(payment.amount)
  return {
    id: payment.id,
    bookingId: payment.id,
    booking: payment.booking,
    guest: payment.guest,
    date: payment.date,
    dateValue: null,
    method: payment.method,
    channel: payment.channel,
    amount: payment.amount,
    amountValue,
    status: payment.status,
    notes: null,
  }
}

export function PaymentsPage() {
  const { pushToast } = useToast()
  const queryClient = useQueryClient()
  const useDemoData = !isSupabaseConfigured
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<PaymentStatus[]>(allStatuses)
  const [activeChannels, setActiveChannels] = useState<string[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [paymentFormMode, setPaymentFormMode] = useState<'create' | 'edit'>('create')
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm)
  const [paymentFormErrors, setPaymentFormErrors] = useState<Record<string, string>>({})
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payments'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return []
      }
      const { data: rows, error } = await supabase
        .from('payments')
        .select(
          [
            'id',
            'amount',
            'payment_date',
            'payment_method',
            'notes',
            'booking_id',
            'created_at',
            'booking_summary(booking_reference,guest_name,channel_name)',
          ].join(',')
        )
        .order('payment_date', { ascending: false })

      if (error) {
        throw error
      }

      return (rows ?? []) as unknown as PaymentRow[]
    },
  })

  const { data: bookingOptions } = useQuery({
    queryKey: ['payment-booking-options'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return []
      }
      const { data: rows, error } = await supabase
        .from('booking_summary')
        .select('id, booking_reference, guest_name')
        .order('check_in_date', { ascending: false })

      if (error) {
        throw error
      }

      return (rows ?? []) as unknown as BookingOption[]
    },
  })

  const paymentItems = useMemo(() => {
    if (useDemoData) {
      return demoPayments.map(mapDemoPayment)
    }
    return (data ?? []).map(mapPaymentRow)
  }, [data, useDemoData])
  const channels = useMemo(
    () => Array.from(new Set(paymentItems.map((payment) => payment.channel))).sort(),
    [paymentItems]
  )

  useEffect(() => {
    if (channels.length > 0) {
      setActiveChannels(channels)
    }
  }, [channels])

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return paymentItems.filter((payment) => {
      const matchesStatus = activeStatuses.includes(payment.status)
      const matchesChannel = activeChannels.includes(payment.channel)
      const matchesQuery =
        query.length === 0 ||
        payment.booking.toLowerCase().includes(query) ||
        payment.guest.toLowerCase().includes(query)
      return matchesStatus && matchesChannel && matchesQuery
    })
  }, [activeChannels, activeStatuses, paymentItems, searchTerm])

  const channelBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    paymentItems.forEach((payment) => {
      totals.set(payment.channel, (totals.get(payment.channel) ?? 0) + payment.amountValue)
    })
    const totalAmount = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)
    return Array.from(totals.entries())
      .map(([label, value]) => ({
        label,
        value: formatCurrency(value),
        share: totalAmount > 0 ? value / totalAmount : 0,
      }))
      .sort((a, b) => b.share - a.share)
  }, [paymentItems])

  const pendingPayments = useMemo(() => {
    return paymentItems
      .filter((payment) => payment.status !== 'recibido')
      .slice(0, 3)
      .map((payment) => ({
        label: payment.status === 'reembolsado' ? 'Reembolso' : 'Cobro pendiente',
        detail: `${payment.booking} · ${payment.method}`,
      }))
  }, [paymentItems])

  const pendingCount = paymentItems.filter((payment) => payment.status === 'pendiente').length
  const totalRevenue = paymentItems.reduce((sum, payment) => sum + payment.amountValue, 0)
  const refundTotal = paymentItems
    .filter((payment) => payment.status === 'reembolsado')
    .reduce((sum, payment) => sum + payment.amountValue, 0)
  const selectedPayment = paymentItems.find((payment) => payment.id === selectedPaymentId) ?? null

  const toggleStatus = (status: PaymentStatus) => {
    setActiveStatuses((prev) => {
      const next = prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
      return next.length === 0 ? allStatuses : next
    })
  }

  const toggleChannel = (channel: string) => {
    setActiveChannels((prev) => {
      const next = prev.includes(channel) ? prev.filter((item) => item !== channel) : [...prev, channel]
      return next.length === 0 ? channels : next
    })
  }

  const paymentMutation = useMutation({
    mutationFn: async (payload: { mode: 'create' | 'edit'; id?: string; data: PaymentFormState }) => {
      if (!supabase) {
        throw new Error('Supabase no configurado.')
      }
      const amountValue = parseCurrency(payload.data.amount)
      const data: {
        booking_id: string
        amount: number
        payment_method: string
        payment_date?: string
        notes?: string | null
      } = {
        booking_id: payload.data.bookingId,
        amount: amountValue,
        payment_method: payload.data.paymentMethod,
        notes: payload.data.notes.trim() || null,
      }
      if (payload.data.paymentDate) {
        data.payment_date = new Date(`${payload.data.paymentDate}T00:00:00`).toISOString()
      } else if (payload.mode === 'create') {
        data.payment_date = new Date().toISOString()
      }

      if (payload.mode === 'create') {
        const { error } = await supabase.from('payments').insert(data)
        if (error) {
          throw error
        }
        return
      }

      if (!payload.id) {
        throw new Error('No se encontro el pago para editar.')
      }
      const { error } = await supabase.from('payments').update(data).eq('id', payload.id)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      pushToast({
        title: paymentFormMode === 'create' ? 'Pago registrado' : 'Pago actualizado',
        description: 'El movimiento quedo guardado.',
        variant: 'success',
      })
      setPaymentFormOpen(false)
      setEditingPaymentId(null)
      setPaymentFormErrors({})
    },
    onError: (error: Error) => {
      pushToast({
        title: 'No se pudo guardar el pago',
        description: error.message,
        variant: 'danger',
      })
    },
  })

  const validatePaymentForm = (form: PaymentFormState) => {
    const errors: Record<string, string> = {}
    if (!form.bookingId) {
      errors.bookingId = 'Reserva obligatoria.'
    }
    if (!form.amount || parseCurrency(form.amount) <= 0) {
      errors.amount = 'Monto invalido.'
    }
    if (!form.paymentMethod) {
      errors.paymentMethod = 'Metodo obligatorio.'
    }
    return errors
  }

  const openCreatePayment = () => {
    setPaymentFormMode('create')
    setEditingPaymentId(null)
    setPaymentForm({ ...emptyPaymentForm })
    setPaymentFormErrors({})
    setPaymentFormOpen(true)
  }

  const openEditPayment = (payment: PaymentListItem) => {
    setPaymentFormMode('edit')
    setEditingPaymentId(payment.id)
    setPaymentForm({
      bookingId: payment.bookingId,
      amount: String(payment.amountValue),
      paymentMethod:
        payment.method === 'Efectivo'
          ? 'CASH'
          : payment.method === 'Tarjeta'
          ? 'CARD'
          : payment.method === 'Transferencia'
            ? 'TRANSFER'
            : 'ONLINE',
      paymentDate: payment.dateValue ? payment.dateValue.slice(0, 10) : '',
      notes: payment.notes ?? '',
    })
    setPaymentFormErrors({})
    setPaymentFormOpen(true)
  }

  const handlePaymentSave = () => {
    if (!isSupabaseConfigured) {
      pushToast({
        title: 'Modo demo',
        description: 'Configura Supabase para registrar pagos.',
        variant: 'warning',
      })
      return
    }
    const errors = validatePaymentForm(paymentForm)
    setPaymentFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: 'Campos incompletos',
        description: 'Revisa la informacion obligatoria.',
        variant: 'warning',
      })
      return
    }
    paymentMutation.mutate({ mode: paymentFormMode, id: editingPaymentId ?? undefined, data: paymentForm })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Pagos"
        title="Flujo de ingresos"
        description="Controla el estado de cobros, metodos y movimientos recientes sin salir del panel."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                pushToast({
                  title: 'Reporte listo',
                  description: 'Se genero el reporte del mes.',
                  variant: 'info',
                })
              }
            >
              Descargar reporte
            </Button>
            <Button
              variant="primary"
              onClick={openCreatePayment}
            >
              Registrar pago
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos mes" value={formatCurrency(totalRevenue)} helper="COP estimado" accent="teal" />
        <StatCard label="Pendiente" value={`${pendingCount}`} helper="Pagos sin confirmar" accent="amber" />
        <StatCard label="Reembolsos" value={formatCurrency(refundTotal)} helper="Ultimos 30 dias" accent="coral" />
        <StatCard label="Metodos" value={`${new Set(paymentItems.map((payment) => payment.method)).size}`} helper="Tarjeta, efectivo, transferencia" accent="navy" />
      </div>

      <Card tone="soft" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Mes actual</Badge>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar reserva o huesped"
            className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] md:w-64"
          />
          <Button variant="ghost" size="xs" onClick={() => setActiveStatuses(allStatuses)}>
            Limpiar estado
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setActiveChannels(channels)}>
            Limpiar canales
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((status) => (
            <FilterChip
              key={status}
              variant={statusMeta[status].variant}
              selected={activeStatuses.includes(status)}
              onClick={() => toggleStatus(status)}
            >
              {statusMeta[status].label}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => (
            <FilterChip
              key={channel}
              selected={activeChannels.includes(channel)}
              onClick={() => toggleChannel(channel)}
            >
              {channel}
            </FilterChip>
          ))}
        </div>
      </Card>

      {useDemoData ? <DemoNotice label="Pagos" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Movimientos recientes</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Ultimas transacciones</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{filteredPayments.length} resultados</Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  <th className="pb-3">Referencia</th>
                  <th className="pb-3">Huesped</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Metodo</th>
                  <th className="pb-3">Canal</th>
                  <th className="pb-3">Monto</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody className="border-t border-black/10">
                {isLoading ? (
                  <tr>
                    <td className="py-4 text-sm text-[var(--ink-muted)]" colSpan={7}>
                      Cargando pagos...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="py-4 text-sm text-[var(--ink-muted)]" colSpan={7}>
                      No se pudieron cargar los pagos.
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-[var(--ink-muted)]" colSpan={7}>
                      No hay pagos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const meta = statusMeta[payment.status]
                    return (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        meta={meta}
                        onSelect={() => setSelectedPaymentId(payment.id)}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <aside className="space-y-6">
          <Card tone="soft" className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Pendientes</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Acciones clave</h3>
            </div>
            <div className="space-y-3">
              {pendingPayments.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">Sin pendientes actuales.</p>
              ) : (
                pendingPayments.map((item) => (
                  <button
                    key={item.detail}
                    type="button"
                    onClick={() =>
                      pushToast({
                        title: item.label,
                        description: 'Seguimiento agregado a tu lista.',
                        variant: 'warning',
                      })
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-3 text-left text-sm transition hover:border-black/20"
                  >
                    <p className="font-semibold text-[var(--ink)]">{item.label}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{item.detail}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Canales</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Distribucion de ingresos</h3>
            </div>
            <div className="space-y-3">
              {channelBreakdown.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">Sin datos de canales.</p>
              ) : (
                channelBreakdown.map((channel) => (
                  <div key={channel.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--ink)]">{channel.label}</span>
                      <span className="text-[var(--ink-muted)]">{channel.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/5">
                      <div
                        className="h-2 rounded-full bg-[var(--navy)]"
                        style={{ width: `${channel.share * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Drawer
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPaymentId(null)}
        title={selectedPayment ? selectedPayment.id : 'Pago'}
        subtitle={selectedPayment ? `${selectedPayment.booking} · ${selectedPayment.guest}` : undefined}
        footer={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedPayment) {
                  openEditPayment(selectedPayment)
                  setSelectedPaymentId(null)
                }
              }}
            >
              Editar pago
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Confirmacion enviada',
                  description: 'Se envio el comprobante al huesped.',
                  variant: 'info',
                })
              }
            >
              Enviar comprobante
            </Button>
          </div>
        }
      >
        {selectedPayment ? <PaymentDetails payment={selectedPayment} /> : null}
      </Drawer>

      <Drawer
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        title={paymentFormMode === 'create' ? 'Registrar pago' : 'Editar pago'}
        subtitle="Movimientos asociados a reservas"
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setPaymentFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handlePaymentSave}>
              {paymentMutation.isPending ? 'Guardando...' : 'Guardar pago'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Reserva</label>
              <select
                value={paymentForm.bookingId}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
              >
                <option value="">Selecciona una reserva</option>
                {(bookingOptions ?? []).map((booking) => {
                  if (!booking.id) {
                    return null
                  }
                  return (
                    <option key={booking.id} value={booking.id}>
                      {booking.booking_reference ?? booking.id} · {booking.guest_name ?? 'Sin huesped'}
                    </option>
                  )
                })}
              </select>
              {paymentFormErrors.bookingId ? (
                <p className="text-xs text-[var(--coral)]">{paymentFormErrors.bookingId}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Monto</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {paymentFormErrors.amount ? (
                  <p className="text-xs text-[var(--coral)]">{paymentFormErrors.amount}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Metodo</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="ONLINE">Online</option>
                </select>
                {paymentFormErrors.paymentMethod ? (
                  <p className="text-xs text-[var(--coral)]">{paymentFormErrors.paymentMethod}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Fecha</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Card>

          <Card tone="soft" className="space-y-3">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas</label>
            <textarea
              rows={3}
              value={paymentForm.notes}
              onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
            />
          </Card>
        </div>
      </Drawer>
    </div>
  )
}

function PaymentRow({
  payment,
  meta,
  onSelect,
}: {
  payment: PaymentListItem
  meta: { label: string; variant: BadgeVariant }
  onSelect: () => void
}) {
  return (
    <tr
      className="cursor-pointer border-b border-black/10 transition hover:bg-black/5"
      onClick={onSelect}
      role="button"
    >
      <td className="py-3 font-semibold text-[var(--ink)]">{payment.booking}</td>
      <td className="py-3 text-[var(--ink-muted)]">{payment.guest}</td>
      <td className="py-3 text-[var(--ink-muted)]">{payment.date}</td>
      <td className="py-3 text-[var(--ink-muted)]">{payment.method}</td>
      <td className="py-3 text-[var(--ink-muted)]">{payment.channel}</td>
      <td className="py-3 font-semibold text-[var(--ink)]">{payment.amount}</td>
      <td className="py-3">
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </td>
    </tr>
  )
}

function PaymentDetails({ payment }: { payment: PaymentListItem }) {
  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Detalle</p>
          <Badge variant={statusMeta[payment.status].variant}>{statusMeta[payment.status].label}</Badge>
        </div>
        <div className="space-y-2 text-sm text-[var(--ink-muted)]">
          <p>
            <span className="text-[var(--ink)]">Reserva:</span> {payment.booking}
          </p>
          <p>
            <span className="text-[var(--ink)]">Huesped:</span> {payment.guest}
          </p>
          <p>
            <span className="text-[var(--ink)]">Metodo:</span> {payment.method}
          </p>
          <p>
            <span className="text-[var(--ink)]">Canal:</span> {payment.channel}
          </p>
          <p>
            <span className="text-[var(--ink)]">Monto:</span> {payment.amount}
          </p>
        </div>
      </Card>

      <Card tone="soft" className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas</p>
        <p className="text-sm text-[var(--ink-muted)]">{payment.notes ?? 'Pago registrado en el turno actual.'}</p>
      </Card>
    </div>
  )
}
