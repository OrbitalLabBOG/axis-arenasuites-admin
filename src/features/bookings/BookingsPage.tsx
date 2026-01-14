import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { DemoNotice } from '@/components/common/DemoNotice'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  addDays,
  diffInDays,
  formatCurrency,
  formatDateKey,
  formatDayLabel,
  formatShortDate,
  getWeekRange,
} from '@/lib/formatters'
import type { Tables } from '@/types/supabase'
import { bookingDays as demoBookingDays, type BookingItem as DemoBookingItem } from './bookingsData'

export type BookingStatus = 'confirmada' | 'pendiente' | 'check-in' | 'check-out' | 'cancelada'

interface BookingListItem {
  id: string
  reference: string
  guest: string
  room: string
  checkInDate: string | null
  checkOutDate: string | null
  checkIn: string
  checkOut: string
  nights: number
  status: BookingStatus
  channel: string
  total: string
  note?: string
}

type BookingSummaryRow = Pick<
  Tables<'booking_summary'>,
  | 'id'
  | 'booking_reference'
  | 'guest_name'
  | 'apartment_number'
  | 'channel_name'
  | 'check_in_date'
  | 'check_out_date'
  | 'total_nights'
  | 'price_per_night'
  | 'total_amount'
  | 'balance_due'
  | 'status'
>

type GuestOption = Pick<Tables<'guests'>, 'id' | 'full_name'>
type ApartmentOption = Pick<Tables<'apartments'>, 'id' | 'number' | 'floor' | 'is_active'>
type ChannelOption = Pick<Tables<'channels'>, 'id' | 'name'>
type BookingRecord = Pick<
  Tables<'bookings'>,
  | 'id'
  | 'guest_id'
  | 'apartment_id'
  | 'channel_id'
  | 'check_in_date'
  | 'check_out_date'
  | 'price_per_night'
  | 'status'
  | 'includes_breakfast'
  | 'breakfast_quantity'
  | 'number_of_guests'
  | 'observations'
>

interface BookingFormState {
  guestId: string
  apartmentId: string
  channelId: string
  checkInDate: string
  checkOutDate: string
  pricePerNight: string
  status: string
  includesBreakfast: boolean
  breakfastQuantity: string
  numberOfGuests: string
  observations: string
}

const emptyBookingForm: BookingFormState = {
  guestId: '',
  apartmentId: '',
  channelId: '',
  checkInDate: '',
  checkOutDate: '',
  pricePerNight: '',
  status: 'PENDING',
  includesBreakfast: false,
  breakfastQuantity: '0',
  numberOfGuests: '1',
  observations: '',
}

const statusMeta: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  confirmada: { label: 'Confirmada', variant: 'available' },
  pendiente: { label: 'Pendiente', variant: 'warning' },
  'check-in': { label: 'Check-in', variant: 'info' },
  'check-out': { label: 'Check-out', variant: 'occupied' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
}

const pendingFocus = [
  { label: 'Confirmar pago', detail: 'Reserva AS-1044 · Parque 63' },
  { label: 'Asignar habitacion', detail: 'Reserva AS-1048 · 1 noche' },
  { label: 'Enviar instrucciones', detail: 'Reserva AS-1041 · Check-in hoy' },
]

const channelMix = [
  { label: 'Directo', value: '$2.1M', share: 0.42 },
  { label: 'Booking', value: '$1.4M', share: 0.28 },
  { label: 'Expedia', value: '$0.9M', share: 0.18 },
  { label: 'Parque 63', value: '$0.6M', share: 0.12 },
]

const allStatuses: BookingStatus[] = ['confirmada', 'pendiente', 'check-in', 'check-out', 'cancelada']

function mapBookingStatus(status?: string | null): BookingStatus {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmada'
    case 'CHECKED_IN':
      return 'check-in'
    case 'CHECKED_OUT':
      return 'check-out'
    case 'CANCELLED':
      return 'cancelada'
    default:
      return 'pendiente'
  }
}

function mapBookingRow(row: BookingSummaryRow): BookingListItem {
  const bookingId = row.id ?? row.booking_reference ?? `booking-${row.apartment_number ?? 'na'}`
  const reference = row.booking_reference ?? bookingId
  const checkInDate = row.check_in_date
  const checkOutDate = row.check_out_date
  const nights = row.total_nights ?? diffInDays(checkInDate, checkOutDate)
  const totalAmount =
    row.total_amount ??
    (row.price_per_night && nights ? row.price_per_night * nights : null)

  const balanceDue = row.balance_due ?? 0
  const note =
    balanceDue > 0
      ? `Saldo pendiente ${formatCurrency(balanceDue)}`
      : row.status === 'PENDING'
        ? 'Pendiente de confirmacion'
        : undefined

  return {
    id: bookingId,
    reference,
    guest: row.guest_name ?? 'Sin huesped',
    room: row.apartment_number ?? '-',
    checkInDate,
    checkOutDate,
    checkIn: formatShortDate(checkInDate),
    checkOut: formatShortDate(checkOutDate),
    nights: nights ?? 0,
    status: mapBookingStatus(row.status),
    channel: row.channel_name ?? 'Sin canal',
    total: formatCurrency(totalAmount),
    note,
  }
}

function mapDemoBooking(item: DemoBookingItem): BookingListItem {
  return {
    id: item.id,
    reference: item.id,
    guest: item.guest,
    room: item.room,
    checkInDate: null,
    checkOutDate: null,
    checkIn: item.checkIn,
    checkOut: item.checkOut,
    nights: item.nights,
    status: item.status,
    channel: item.channel,
    total: item.total,
    note: item.note,
  }
}

function BookingCard({ booking, onSelect }: { booking: BookingListItem; onSelect: () => void }) {
  const meta = statusMeta[booking.status]

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[var(--radius)] border border-black/10 bg-white/85 p-4 text-left shadow-[0_16px_36px_-28px_rgba(var(--shadow),0.45)] transition hover:border-black/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{booking.guest}</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Habitacion {booking.room} · {booking.channel}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        <span>Ingreso {booking.checkIn}</span>
        <span>Salida {booking.checkOut}</span>
        <span>{booking.nights} noches</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-[var(--ink-muted)]">{booking.note ?? 'Sin observaciones'}</p>
        <p className="font-semibold text-[var(--ink)]">{booking.total}</p>
      </div>
    </button>
  )
}

export function BookingsPage() {
  const { pushToast } = useToast()
  const queryClient = useQueryClient()
  const useDemoData = !isSupabaseConfigured
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<BookingStatus[]>(allStatuses)
  const [activeChannels, setActiveChannels] = useState<string[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [bookingFormOpen, setBookingFormOpen] = useState(false)
  const [bookingFormMode, setBookingFormMode] = useState<'create' | 'edit'>('create')
  const [bookingForm, setBookingForm] = useState<BookingFormState>(emptyBookingForm)
  const [bookingFormErrors, setBookingFormErrors] = useState<Record<string, string>>({})
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [bookingFormLoading, setBookingFormLoading] = useState(false)
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())

  const todayKey = formatDateKey(new Date())
  const weekRange = useMemo(() => getWeekRange(weekAnchor), [weekAnchor])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-summary', weekRange.start, weekRange.end],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return []
      }
      const { data: rows, error } = await supabase
        .from('booking_summary')
        .select(
          [
            'id',
            'booking_reference',
            'guest_name',
            'apartment_number',
            'channel_name',
            'check_in_date',
            'check_out_date',
            'total_nights',
            'price_per_night',
            'total_amount',
            'balance_due',
            'status',
          ].join(',')
        )
        .gte('check_in_date', weekRange.start)
        .lte('check_in_date', weekRange.end)
        .order('check_in_date', { ascending: true })

      if (error) {
        throw error
      }

      return (rows ?? []) as unknown as BookingSummaryRow[]
    },
  })

  const { data: bookingOptions } = useQuery({
    queryKey: ['booking-form-options'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return { guests: [], apartments: [], channels: [] }
      }
      const [guestsResult, apartmentsResult, channelsResult] = await Promise.all([
        supabase.from('guests').select('id, full_name').order('full_name', { ascending: true }),
        supabase.from('apartments').select('id, number, floor, is_active').order('number', { ascending: true }),
        supabase.from('channels').select('id, name').order('name', { ascending: true }),
      ])

      if (guestsResult.error) {
        throw guestsResult.error
      }
      if (apartmentsResult.error) {
        throw apartmentsResult.error
      }
      if (channelsResult.error) {
        throw channelsResult.error
      }

      return {
        guests: (guestsResult.data ?? []) as unknown as GuestOption[],
        apartments: (apartmentsResult.data ?? []) as unknown as ApartmentOption[],
        channels: (channelsResult.data ?? []) as unknown as ChannelOption[],
      }
    },
  })

  const bookingItems = useMemo(() => {
    if (useDemoData) {
      return demoBookingDays.flatMap((day) => day.bookings.map(mapDemoBooking))
    }
    return (data ?? []).map(mapBookingRow)
  }, [data, useDemoData])
  const channels = useMemo(
    () => Array.from(new Set(bookingItems.map((booking) => booking.channel))).sort(),
    [bookingItems]
  )

  useEffect(() => {
    if (channels.length > 0) {
      setActiveChannels(channels)
    }
  }, [channels])

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return bookingItems.filter((booking) => {
      const matchesStatus = activeStatuses.includes(booking.status)
      const matchesChannel = activeChannels.includes(booking.channel)
      const matchesQuery =
        query.length === 0 ||
        booking.guest.toLowerCase().includes(query) ||
        booking.reference.toLowerCase().includes(query) ||
        booking.room.toLowerCase().includes(query)
      return matchesStatus && matchesChannel && matchesQuery
    })
  }, [activeChannels, activeStatuses, bookingItems, searchTerm])

  const groupedDays = useMemo(() => {
    if (useDemoData) {
      return demoBookingDays.map((day) => ({
        key: day.date,
        label: day.label,
        date: day.date,
        isToday: day.isToday,
        bookings: day.bookings.map(mapDemoBooking),
      }))
    }
    const groups = new Map<string, BookingListItem[]>()

    filteredBookings.forEach((booking) => {
      const key = booking.checkInDate ?? 'sin-fecha'
      const items = groups.get(key) ?? []
      items.push(booking)
      groups.set(key, items)
    })

    return Array.from(groups.entries())
      .map(([key, bookings]) => {
        const isToday = key === todayKey
        return {
          key,
          label: key === 'sin-fecha' ? 'Sin fecha' : formatDayLabel(key),
          date: key === 'sin-fecha' ? '—' : formatShortDate(key),
          isToday,
          bookings,
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [filteredBookings, todayKey, useDemoData])

  const selectedBooking = bookingItems.find((booking) => booking.id === selectedBookingId) ?? null

  const totalCount = bookingItems.length
  const pendingCount = bookingItems.filter((booking) => booking.status === 'pendiente').length
  const checkInCount = bookingItems.filter((booking) => booking.status === 'check-in').length
  const cancelledCount = bookingItems.filter((booking) => booking.status === 'cancelada').length

  const toggleStatus = (status: BookingStatus) => {
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

  const goToPreviousWeek = () => setWeekAnchor((prev) => addDays(prev, -7))
  const goToCurrentWeek = () => setWeekAnchor(new Date())
  const goToNextWeek = () => setWeekAnchor((prev) => addDays(prev, 7))

  const bookingMutation = useMutation({
    mutationFn: async (payload: { mode: 'create' | 'edit'; id?: string; data: BookingFormState }) => {
      if (!supabase) {
        throw new Error('Supabase no configurado.')
      }
      const pricePerNight = Number(payload.data.pricePerNight)
      const breakfastQuantity = Number(payload.data.breakfastQuantity)
      const numberOfGuests = Number(payload.data.numberOfGuests)

      const data = {
        guest_id: payload.data.guestId,
        apartment_id: payload.data.apartmentId,
        channel_id: payload.data.channelId,
        check_in_date: payload.data.checkInDate,
        check_out_date: payload.data.checkOutDate,
        price_per_night: pricePerNight,
        status: payload.data.status,
        includes_breakfast: payload.data.includesBreakfast,
        breakfast_quantity: breakfastQuantity,
        number_of_guests: numberOfGuests,
        observations: payload.data.observations.trim() || null,
      }

      if (payload.mode === 'create') {
        const { error } = await supabase.from('bookings').insert(data)
        if (error) {
          throw error
        }
        return
      }

      if (!payload.id) {
        throw new Error('No se encontro la reserva para editar.')
      }
      const { error } = await supabase.from('bookings').update(data).eq('id', payload.id)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-summary'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      pushToast({
        title: bookingFormMode === 'create' ? 'Reserva creada' : 'Reserva actualizada',
        description: 'Los cambios se guardaron correctamente.',
        variant: 'success',
      })
      setBookingFormOpen(false)
      setEditingBookingId(null)
      setBookingFormErrors({})
    },
    onError: (error: Error) => {
      pushToast({
        title: 'No se pudo guardar la reserva',
        description: error.message,
        variant: 'danger',
      })
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!supabase) {
        throw new Error('Supabase no configurado.')
      }
      const { error } = await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-summary'] })
      pushToast({
        title: 'Reserva cancelada',
        description: 'La reserva se marco como cancelada.',
        variant: 'success',
      })
      setSelectedBookingId(null)
    },
    onError: (error: Error) => {
      pushToast({
        title: 'No se pudo cancelar',
        description: error.message,
        variant: 'danger',
      })
    },
  })

  const validateBookingForm = (form: BookingFormState) => {
    const errors: Record<string, string> = {}
    if (!form.guestId) {
      errors.guestId = 'Huesped obligatorio.'
    }
    if (!form.apartmentId) {
      errors.apartmentId = 'Habitacion obligatoria.'
    }
    if (!form.channelId) {
      errors.channelId = 'Canal obligatorio.'
    }
    if (!form.checkInDate) {
      errors.checkInDate = 'Fecha de ingreso obligatoria.'
    }
    if (!form.checkOutDate) {
      errors.checkOutDate = 'Fecha de salida obligatoria.'
    }
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) {
      errors.pricePerNight = 'Tarifa invalida.'
    }
    if (form.checkInDate && form.checkOutDate && form.checkOutDate <= form.checkInDate) {
      errors.checkOutDate = 'Salida debe ser posterior al ingreso.'
    }
    if (!form.numberOfGuests || Number(form.numberOfGuests) <= 0) {
      errors.numberOfGuests = 'Numero de huespedes invalido.'
    }
    if (form.includesBreakfast && Number(form.breakfastQuantity) < 0) {
      errors.breakfastQuantity = 'Cantidad de desayunos invalida.'
    }
    return errors
  }

  const openCreateBooking = () => {
    setBookingFormMode('create')
    setEditingBookingId(null)
    setBookingForm({ ...emptyBookingForm })
    setBookingFormErrors({})
    setBookingFormOpen(true)
  }

  const openEditBooking = async (booking: BookingListItem) => {
    if (!supabase) {
      pushToast({
        title: 'Modo demo',
        description: 'Configura Supabase para editar reservas.',
        variant: 'warning',
      })
      return
    }
    setBookingFormLoading(true)
    try {
      const { data: record, error } = await supabase
        .from('bookings')
        .select(
          [
            'id',
            'guest_id',
            'apartment_id',
            'channel_id',
            'check_in_date',
            'check_out_date',
            'price_per_night',
            'status',
            'includes_breakfast',
            'breakfast_quantity',
            'number_of_guests',
            'observations',
          ].join(',')
        )
        .eq('id', booking.id)
        .single()

      if (error) {
        throw error
      }
      const bookingRecord = record as unknown as BookingRecord | null
      if (!bookingRecord) {
        throw new Error('No se encontro la reserva.')
      }

      setBookingFormMode('edit')
      setEditingBookingId(bookingRecord.id)
      setBookingForm({
        guestId: bookingRecord.guest_id,
        apartmentId: bookingRecord.apartment_id,
        channelId: bookingRecord.channel_id,
        checkInDate: bookingRecord.check_in_date,
        checkOutDate: bookingRecord.check_out_date,
        pricePerNight: bookingRecord.price_per_night ? String(bookingRecord.price_per_night) : '',
        status: bookingRecord.status ?? 'PENDING',
        includesBreakfast: bookingRecord.includes_breakfast ?? false,
        breakfastQuantity: String(bookingRecord.breakfast_quantity ?? 0),
        numberOfGuests: String(bookingRecord.number_of_guests ?? 1),
        observations: bookingRecord.observations ?? '',
      })
      setBookingFormErrors({})
      setBookingFormOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar la reserva.'
      pushToast({
        title: 'Error al cargar',
        description: message,
        variant: 'danger',
      })
    } finally {
      setBookingFormLoading(false)
    }
  }

  const handleBookingSave = () => {
    if (!isSupabaseConfigured) {
      pushToast({
        title: 'Modo demo',
        description: 'Configura Supabase para guardar reservas.',
        variant: 'warning',
      })
      return
    }
    const errors = validateBookingForm(bookingForm)
    setBookingFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: 'Campos incompletos',
        description: 'Revisa la informacion obligatoria.',
        variant: 'warning',
      })
      return
    }
    bookingMutation.mutate({ mode: bookingFormMode, id: editingBookingId ?? undefined, data: bookingForm })
  }

  const handleCancelBooking = () => {
    if (!selectedBooking?.id) {
      return
    }
    cancelBookingMutation.mutate(selectedBooking.id)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Reservas"
        title="Agenda semanal"
        description="Organiza check-ins y salidas sin usar un calendario denso. Prioriza las reservas activas por dia."
        actions={
          <>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar reserva o huesped"
              className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] md:w-64"
            />
            <Button
              variant="primary"
              onClick={openCreateBooking}
            >
              Nueva reserva
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reservas" value={`${totalCount}`} helper="Activas esta semana" accent="teal" />
        <StatCard label="Check-ins" value={`${checkInCount}`} helper="Por iniciar" accent="navy" />
        <StatCard label="Pendientes" value={`${pendingCount}`} helper="Sin pago completo" accent="amber" />
        <StatCard label="Canceladas" value={`${cancelledCount}`} helper="Requiere seguimiento" accent="coral" />
      </div>

      <Card tone="soft" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Semana {weekRange.label}</Badge>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="xs" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
                Semana anterior
              </Button>
              <Button variant="secondary" size="xs" onClick={goToCurrentWeek}>
                Semana actual
              </Button>
              <Button variant="ghost" size="xs" onClick={goToNextWeek}>
                Semana siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="xs" onClick={() => setActiveStatuses(allStatuses)}>
              Limpiar estados
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setActiveChannels(channels)}>
              Limpiar canales
            </Button>
          </div>
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

      {useDemoData ? <DemoNotice label="Reservas" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          {isLoading ? (
            <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
              Cargando reservas...
            </Card>
          ) : isError ? (
            <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
              No se pudieron cargar las reservas.
            </Card>
          ) : groupedDays.length === 0 ? (
            <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
              No hay reservas con los filtros actuales.
            </Card>
          ) : (
            groupedDays.map((day) => (
              <Card key={day.key} className={day.isToday ? 'border-[var(--teal)]/30 bg-white/90' : undefined}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">{day.label}</p>
                    <p className="text-sm font-semibold text-[var(--ink)]">{day.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.isToday ? <Badge variant="info">Hoy</Badge> : null}
                    <Badge variant="default">{day.bookings.length} reservas</Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  {day.bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} onSelect={() => setSelectedBookingId(booking.id)} />
                  ))}
                </div>
              </Card>
            ))
          )}
        </section>

        <aside className="space-y-6">
          <Card tone="soft" className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Pendientes del dia</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Prioridades</h3>
            </div>
            <div className="space-y-3">
              {pendingFocus.map((item) => (
                <button
                  key={item.detail}
                  type="button"
                  onClick={() =>
                    pushToast({
                      title: item.label,
                      description: 'Tarea marcada para seguimiento.',
                      variant: 'warning',
                    })
                  }
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-3 text-left text-sm transition hover:border-black/20"
                >
                  <p className="font-semibold text-[var(--ink)]">{item.label}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{item.detail}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Mix de canales</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Distribucion semanal</h3>
            </div>
            <div className="space-y-3">
              {channelMix.map((channel) => (
                <div key={channel.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--ink)]">{channel.label}</span>
                    <span className="text-[var(--ink-muted)]">{channel.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/5">
                    <div
                      className="h-2 rounded-full bg-[var(--teal)]"
                      style={{ width: `${channel.share * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Drawer
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBookingId(null)}
        title={selectedBooking ? selectedBooking.reference : 'Reserva'}
        subtitle={selectedBooking ? `Habitacion ${selectedBooking.room} · ${selectedBooking.guest}` : undefined}
        footer={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedBooking) {
                  openEditBooking(selectedBooking)
                  setSelectedBookingId(null)
                }
              }}
            >
              Editar reserva
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancelBooking}>
              Cancelar reserva
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Confirmacion enviada',
                  description: 'Se envio el detalle al huesped.',
                  variant: 'info',
                })
              }
            >
              Enviar confirmacion
            </Button>
          </div>
        }
      >
        {selectedBooking ? (
          <div className="space-y-6">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Estado</p>
                <Badge variant={statusMeta[selectedBooking.status].variant}>
                  {statusMeta[selectedBooking.status].label}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-[var(--ink-muted)]">
                <p>
                  <span className="text-[var(--ink)]">Ingreso:</span> {selectedBooking.checkIn}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Salida:</span> {selectedBooking.checkOut}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Canal:</span> {selectedBooking.channel}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Total:</span> {selectedBooking.total}
                </p>
              </div>
            </Card>

            <Card tone="soft" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas</p>
              <p className="text-sm text-[var(--ink-muted)]">{selectedBooking.note ?? 'Sin observaciones registradas.'}</p>
            </Card>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Acciones sugeridas</p>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    pushToast({
                      title: 'Check-in programado',
                      description: 'Se preparo el flujo de check-in digital.',
                      variant: 'info',
                    })
                  }
                >
                  Preparar check-in
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    pushToast({
                      title: 'Pago solicitado',
                      description: 'Se envio recordatorio de pago.',
                      variant: 'warning',
                    })
                  }
                >
                  Solicitar pago
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={bookingFormOpen}
        onClose={() => setBookingFormOpen(false)}
        title={bookingFormMode === 'create' ? 'Nueva reserva' : 'Editar reserva'}
        subtitle="Datos obligatorios para registrar la reserva"
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setBookingFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleBookingSave}>
              {bookingMutation.isPending || bookingFormLoading ? 'Guardando...' : 'Guardar reserva'}
            </Button>
          </div>
        }
      >
        {bookingFormLoading ? (
          <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
            Cargando datos de la reserva...
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Huesped</label>
                  <select
                    value={bookingForm.guestId}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, guestId: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona un huesped</option>
                    {(bookingOptions?.guests ?? []).map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.full_name}
                      </option>
                    ))}
                  </select>
                  {bookingFormErrors.guestId ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.guestId}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Habitacion</label>
                  <select
                    value={bookingForm.apartmentId}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, apartmentId: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona habitacion</option>
                    {(bookingOptions?.apartments ?? []).map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.number} · Piso {room.floor}
                      </option>
                    ))}
                  </select>
                  {bookingFormErrors.apartmentId ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.apartmentId}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Canal</label>
                  <select
                    value={bookingForm.channelId}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, channelId: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona canal</option>
                    {(bookingOptions?.channels ?? []).map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                  {bookingFormErrors.channelId ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.channelId}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Estado</label>
                  <select
                    value={bookingForm.status}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="CHECKED_IN">Check-in</option>
                    <option value="CHECKED_OUT">Check-out</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Ingreso</label>
                  <input
                    type="date"
                    value={bookingForm.checkInDate}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, checkInDate: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  />
                  {bookingFormErrors.checkInDate ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.checkInDate}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Salida</label>
                  <input
                    type="date"
                    value={bookingForm.checkOutDate}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, checkOutDate: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  />
                  {bookingFormErrors.checkOutDate ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.checkOutDate}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Tarifa noche</label>
                  <input
                    type="number"
                    value={bookingForm.pricePerNight}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, pricePerNight: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  />
                  {bookingFormErrors.pricePerNight ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.pricePerNight}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Numero de huespedes</label>
                  <input
                    type="number"
                    value={bookingForm.numberOfGuests}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, numberOfGuests: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  />
                  {bookingFormErrors.numberOfGuests ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.numberOfGuests}</p>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card tone="soft" className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={bookingForm.includesBreakfast}
                  onChange={(event) =>
                    setBookingForm((prev) => ({ ...prev, includesBreakfast: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-black/20"
                />
                <span>Incluye desayuno</span>
              </div>
              {bookingForm.includesBreakfast ? (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Cantidad desayunos</label>
                  <input
                    type="number"
                    value={bookingForm.breakfastQuantity}
                    onChange={(event) => setBookingForm((prev) => ({ ...prev, breakfastQuantity: event.target.value }))}
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                  />
                  {bookingFormErrors.breakfastQuantity ? (
                    <p className="text-xs text-[var(--coral)]">{bookingFormErrors.breakfastQuantity}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Observaciones</label>
                <textarea
                  rows={3}
                  value={bookingForm.observations}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, observations: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
