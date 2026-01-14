import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { FilterChip } from '@/components/ui/FilterChip'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDateKey, formatShortDate } from '@/lib/formatters'
import { DemoNotice } from '@/components/common/DemoNotice'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'
import { rooms as demoRooms, type Room as DemoRoom } from './roomsData'

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance'

interface RoomItem {
  id: string
  number: string
  floor: number
  status: RoomStatus
  type: string
  rate: string
  guest?: string
  checkIn?: string
  checkOut?: string
  channel?: string
  housekeeping?: string
  note?: string
}

type ApartmentRow = Pick<
  Tables<'apartments'>,
  'id' | 'number' | 'floor' | 'capacity' | 'notes' | 'is_active'
>

type BookingSummaryRow = Pick<
  Tables<'booking_summary'>,
  | 'id'
  | 'apartment_number'
  | 'guest_name'
  | 'channel_name'
  | 'check_in_date'
  | 'check_out_date'
  | 'status'
  | 'price_per_night'
>

const statusMeta: Record<RoomStatus, { label: string; badge: BadgeVariant }> = {
  available: { label: 'Disponible', badge: 'available' },
  occupied: { label: 'Ocupada', badge: 'occupied' },
  cleaning: { label: 'Limpieza', badge: 'cleaning' },
  maintenance: { label: 'Mantenimiento', badge: 'maintenance' },
}

const roomTasks = [
  { title: 'Actualizar tarifa', detail: 'Ultima revision hace 5 dias' },
  { title: 'Revisar minibar', detail: 'Pendiente inventario' },
  { title: 'Confirmar salida', detail: 'Coordinar limpieza' },
]

const allStatuses: RoomStatus[] = ['available', 'occupied', 'cleaning', 'maintenance']

function deriveRoomType(): string {
  return 'Habitacion'
}

function selectActiveBooking(bookings: BookingSummaryRow[], todayKey: string): BookingSummaryRow | null {
  const active = bookings.find(
    (booking) =>
      booking.check_in_date &&
      booking.check_out_date &&
      booking.check_in_date <= todayKey &&
      booking.check_out_date > todayKey &&
      booking.status !== 'CANCELLED'
  )
  return active ?? null
}

function selectCheckoutBooking(bookings: BookingSummaryRow[], todayKey: string): BookingSummaryRow | null {
  return (
    bookings.find(
      (booking) =>
        booking.check_out_date === todayKey && booking.status === 'CHECKED_OUT'
    ) ?? null
  )
}

function selectNextBooking(bookings: BookingSummaryRow[], todayKey: string): BookingSummaryRow | null {
  const upcoming = bookings
    .filter((booking) => booking.check_in_date && booking.check_in_date > todayKey)
    .sort((a, b) => (a.check_in_date ?? '').localeCompare(b.check_in_date ?? ''))

  return upcoming[0] ?? null
}

function mapRooms(
  apartments: ApartmentRow[],
  bookings: BookingSummaryRow[],
  todayKey: string
): RoomItem[] {
  const bookingsByRoom = new Map<string, BookingSummaryRow[]>()

  bookings.forEach((booking) => {
    if (!booking.apartment_number) {
      return
    }
    const list = bookingsByRoom.get(booking.apartment_number) ?? []
    list.push(booking)
    bookingsByRoom.set(booking.apartment_number, list)
  })

  return apartments.map((apartment) => {
    const roomBookings = bookingsByRoom.get(apartment.number) ?? []
    const activeBooking = selectActiveBooking(roomBookings, todayKey)
    const checkoutBooking = selectCheckoutBooking(roomBookings, todayKey)
    const upcomingBooking = selectNextBooking(roomBookings, todayKey)

    let status: RoomStatus = 'available'
    let guest: string | undefined
    let checkIn: string | undefined
    let checkOut: string | undefined
    let channel: string | undefined
    let housekeeping: string | undefined
    let note: string | undefined
    let rateValue: number | null = null

    if (!apartment.is_active) {
      status = 'maintenance'
      note = apartment.notes ?? 'Fuera de servicio'
    } else if (activeBooking) {
      status = 'occupied'
      guest = activeBooking.guest_name ?? undefined
      checkIn = formatShortDate(activeBooking.check_in_date)
      checkOut = formatShortDate(activeBooking.check_out_date)
      channel = activeBooking.channel_name ?? undefined
      rateValue = activeBooking.price_per_night ?? null
    } else if (checkoutBooking) {
      status = 'cleaning'
      guest = checkoutBooking.guest_name ?? undefined
      checkOut = formatShortDate(checkoutBooking.check_out_date)
      channel = checkoutBooking.channel_name ?? undefined
      housekeeping = 'Limpieza programada'
      rateValue = checkoutBooking.price_per_night ?? null
    } else if (upcomingBooking) {
      status = 'available'
      guest = upcomingBooking.guest_name ?? undefined
      checkIn = formatShortDate(upcomingBooking.check_in_date)
      checkOut = formatShortDate(upcomingBooking.check_out_date)
      channel = upcomingBooking.channel_name ?? undefined
      note = `Ingreso ${formatShortDate(upcomingBooking.check_in_date)}`
      rateValue = upcomingBooking.price_per_night ?? null
    } else {
      housekeeping = 'Lista para check-in'
    }

    return {
      id: apartment.id,
      number: apartment.number,
      floor: apartment.floor,
      status,
      type: deriveRoomType(),
      rate: rateValue ? formatCurrency(rateValue) : '—',
      guest,
      checkIn,
      checkOut,
      channel,
      housekeeping,
      note,
    }
  })
}

function mapDemoRoom(room: DemoRoom): RoomItem {
  return {
    id: room.number,
    number: room.number,
    floor: room.floor,
    status: room.status,
    type: room.type,
    rate: room.rate,
    guest: room.guest,
    checkIn: room.checkIn,
    checkOut: room.checkOut,
    channel: room.channel,
    housekeeping: room.housekeeping,
    note: room.note,
  }
}

function RoomCard({
  room,
  onDetails,
  onAction,
}: {
  room: RoomItem
  onDetails: (room: RoomItem) => void
  onAction: (room: RoomItem) => void
}) {
  const meta = statusMeta[room.status]
  const quickAction =
    room.status === 'available'
      ? 'Nueva reserva'
      : room.status === 'occupied'
        ? 'Check-out'
        : room.status === 'cleaning'
          ? 'Marcar lista'
          : 'Revisar'

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-black/10 bg-white/85 p-4 shadow-[0_18px_40px_-30px_rgba(var(--shadow),0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(var(--shadow),0.6)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)]">Habitacion {room.number}</p>
          <h3 className="text-lg font-semibold text-[var(--ink)]">{room.type}</h3>
        </div>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--ink)]">{room.guest ?? 'Sin asignar'}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {room.guest && room.checkIn && room.checkOut
            ? `${room.checkIn} → ${room.checkOut} · ${room.channel ?? 'Sin canal'}`
            : room.housekeeping ?? room.note ?? 'Lista para nueva reserva'}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
        <span>{room.checkOut ? 'Salida' : 'Tarifa'}</span>
        <span className="text-sm font-semibold text-[var(--ink)]">{room.checkOut ?? room.rate}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="xs" onClick={() => onDetails(room)}>
          Detalle
        </Button>
        <Button variant="primary" size="xs" onClick={() => onAction(room)}>
          {quickAction}
        </Button>
      </div>
    </div>
  )
}

export function RoomsPage() {
  const { pushToast } = useToast()
  const useDemoData = !isSupabaseConfigured
  const [roomList, setRoomList] = useState<RoomItem[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [activeStatuses, setActiveStatuses] = useState<RoomStatus[]>(allStatuses)

  const todayKey = formatDateKey(new Date())
  const rangeEndDate = new Date()
  rangeEndDate.setDate(rangeEndDate.getDate() + 7)
  const rangeEndKey = formatDateKey(rangeEndDate)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rooms', todayKey],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return { apartments: [], bookings: [] }
      }
      const [apartmentsResult, bookingsResult] = await Promise.all([
        supabase
          .from('apartments')
          .select('id, number, floor, capacity, notes, is_active'),
        supabase
          .from('booking_summary')
          .select(
            'id, apartment_number, guest_name, channel_name, check_in_date, check_out_date, status, price_per_night'
          )
          .gte('check_out_date', todayKey)
          .lte('check_in_date', rangeEndKey),
      ])

      if (apartmentsResult.error) {
        throw apartmentsResult.error
      }
      if (bookingsResult.error) {
        throw bookingsResult.error
      }

      return {
        apartments: (apartmentsResult.data ?? []) as unknown as ApartmentRow[],
        bookings: (bookingsResult.data ?? []) as unknown as BookingSummaryRow[],
      }
    },
  })

  useEffect(() => {
    if (useDemoData) {
      setRoomList(demoRooms.map(mapDemoRoom))
      return
    }
    if (data) {
      setRoomList(mapRooms(data.apartments, data.bookings, todayKey))
    }
  }, [data, todayKey, useDemoData])

  const selectedRoom = roomList.find((room) => room.id === selectedRoomId) ?? null

  const total = roomList.length
  const occupiedCount = roomList.filter((room) => room.status === 'occupied').length
  const availableCount = roomList.filter((room) => room.status === 'available').length
  const cleaningCount = roomList.filter((room) => room.status === 'cleaning').length
  const maintenanceCount = roomList.filter((room) => room.status === 'maintenance').length
  const occupancyRate = total > 0 ? Math.round((occupiedCount / total) * 100) : 0

  const floors = useMemo(() => {
    return [2, 3].map((floor) => {
      const floorRooms = roomList.filter((room) => room.floor === floor)
      const visibleRooms = floorRooms.filter((room) => activeStatuses.includes(room.status))
      return { label: `Piso ${floor}`, floorRooms, visibleRooms }
    })
  }, [roomList, activeStatuses])

  const priorityAlerts = useMemo(() => {
    const alerts: { title: string; detail: string }[] = []
    const maintenanceRooms = roomList.filter((room) => room.status === 'maintenance')
    maintenanceRooms.slice(0, 1).forEach((room) => {
      alerts.push({
        title: 'Mantenimiento pendiente',
        detail: `Habitacion ${room.number} · ${room.note ?? 'Revision programada'}`,
      })
    })

    const cleaningRooms = roomList.filter((room) => room.status === 'cleaning')
    cleaningRooms.slice(0, 1).forEach((room) => {
      alerts.push({
        title: 'Limpieza en curso',
        detail: `Habitacion ${room.number} · ${room.housekeeping ?? 'En progreso'}`,
      })
    })

    const occupiedRooms = roomList.filter((room) => room.status === 'occupied')
    occupiedRooms.slice(0, 1).forEach((room) => {
      alerts.push({
        title: 'Salida programada',
        detail: `Habitacion ${room.number} · ${room.checkOut ?? 'Salida hoy'}`,
      })
    })

    return alerts
  }, [roomList])

  const housekeepingQueue = useMemo(() => {
    const timeSlots = ['11:00 AM', '12:20 PM', '2:00 PM', '3:15 PM']
    const cleaningRooms = roomList.filter((room) => room.status === 'cleaning')
    return cleaningRooms.map((room, index) => ({
      room: room.number,
      task: room.housekeeping ?? 'Limpieza programada',
      time: timeSlots[index % timeSlots.length],
    }))
  }, [roomList])

  const arrivals = useMemo(() => {
    const timeSlots = ['2:00 PM', '3:20 PM', '4:10 PM']
    if (!useDemoData && data?.bookings) {
      const todayArrivals = data.bookings.filter(
        (booking) => booking.check_in_date === todayKey && booking.status !== 'CANCELLED'
      )
      return todayArrivals.map((booking, index) => ({
        guest: booking.guest_name ?? 'Sin huesped',
        room: booking.apartment_number ?? '-',
        time: timeSlots[index % timeSlots.length],
      }))
    }

    const availableRooms = roomList.filter((room) => room.status === 'available')
    return availableRooms.slice(0, 3).map((room, index) => ({
      guest: room.guest ?? 'Check-in pendiente',
      room: room.number,
      time: timeSlots[index % timeSlots.length],
    }))
  }, [data, roomList, todayKey, useDemoData])

  const toggleStatus = (status: RoomStatus) => {
    setActiveStatuses((prev) => {
      const next = prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
      return next.length === 0 ? allStatuses : next
    })
  }

  const handleQuickFilter = (status: RoomStatus) => {
    setActiveStatuses([status])
    pushToast({
      title: `Filtro activo: ${statusMeta[status].label}`,
      description: 'Mostrando solo habitaciones en este estado.',
      variant: 'info',
    })
  }

  const handleRoomAction = (room: RoomItem) => {
    let title = ''
    let description = ''
    let nextStatus = room.status

    if (room.status === 'available') {
      title = 'Reserva iniciada'
      description = `Habitacion ${room.number} lista para asignar.`
    } else if (room.status === 'occupied') {
      title = 'Check-out registrado'
      description = `Habitacion ${room.number} pasa a limpieza.`
      nextStatus = 'cleaning'
    } else if (room.status === 'cleaning') {
      title = 'Habitacion lista'
      description = `Habitacion ${room.number} disponible para check-in.`
      nextStatus = 'available'
    } else {
      title = 'Revision programada'
      description = `Se actualizo el seguimiento de ${room.number}.`
    }

    if (nextStatus !== room.status) {
      setRoomList((prev) =>
        prev.map((item) =>
          item.id === room.id
            ? {
                ...item,
                status: nextStatus,
                guest: nextStatus === 'available' ? undefined : item.guest,
                checkIn: nextStatus === 'available' ? undefined : item.checkIn,
                checkOut: nextStatus === 'available' ? undefined : item.checkOut,
                channel: nextStatus === 'available' ? undefined : item.channel,
                housekeeping: nextStatus === 'cleaning' ? 'Limpieza programada' : item.housekeeping,
              }
            : item
        )
      )
    }

    pushToast({
      title,
      description,
      variant: 'success',
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Operacion diaria"
        title="Habitaciones"
        description="Estado operativo por piso. Prioriza limpieza, salidas y nuevos check-ins sin perder claridad."
        actions={
          <>
            <div className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Hoy · {formatShortDate(todayKey)}
            </div>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Bloqueo creado',
                  description: 'Se genero un bloqueo temporal en el inventario.',
                  variant: 'info',
                })
              }
            >
              Crear bloqueo
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ocupacion" value={`${occupancyRate}%`} helper={`${occupiedCount} de ${total} activas`} accent="teal" />
        <StatCard label="Disponibles" value={`${availableCount}`} helper="Listas para vender" accent="navy" />
        <StatCard label="Limpieza" value={`${cleaningCount}`} helper="En proceso hoy" accent="amber" />
        <StatCard label="Mantenimiento" value={`${maintenanceCount}`} helper="Fuera de inventario" accent="coral" />
      </div>

      <Card tone="soft" className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Filtros rapidos</span>
        {allStatuses.map((status) => (
          <FilterChip
            key={status}
            variant={statusMeta[status].badge}
            selected={activeStatuses.includes(status)}
            onClick={() => toggleStatus(status)}
          >
            {statusMeta[status].label}
          </FilterChip>
        ))}
        <Button variant="ghost" size="xs" onClick={() => handleQuickFilter('cleaning')}>
          Ver limpieza
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setActiveStatuses(allStatuses)}>
          Restablecer
        </Button>
      </Card>

      {useDemoData ? <DemoNotice label="Habitaciones" /> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-8">
          {isLoading ? (
            <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
              Cargando habitaciones...
            </Card>
          ) : isError ? (
            <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
              No se pudieron cargar las habitaciones.
            </Card>
          ) : (
            floors.map((floor) => (
              <div key={floor.label} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-[var(--ink)]">{floor.label}</h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                      {floor.floorRooms.length} habitaciones activas
                    </p>
                  </div>
                  <Badge variant="info">
                    {floor.floorRooms.filter((room) => room.status === 'occupied').length} ocupadas
                  </Badge>
                </div>
                {floor.visibleRooms.length === 0 ? (
                  <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
                    No hay habitaciones con los filtros actuales.
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {floor.visibleRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onDetails={(target) => setSelectedRoomId(target.id)}
                        onAction={handleRoomAction}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        <aside className="space-y-6">
          <Card tone="soft" className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Alertas prioritarias</p>
              <h3 className="text-xl font-semibold text-[var(--ink)]">Atencion inmediata</h3>
            </div>
            <div className="space-y-3">
              {priorityAlerts.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">Sin alertas prioritarias por ahora.</p>
              ) : (
                priorityAlerts.map((alert) => (
                  <button
                    key={alert.detail}
                    type="button"
                    onClick={() =>
                      pushToast({
                        title: alert.title,
                        description: 'Seguimiento agregado a tu lista.',
                        variant: 'warning',
                      })
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/80 p-3 text-left text-sm transition hover:border-black/20"
                  >
                    <p className="font-semibold text-[var(--ink)]">{alert.title}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{alert.detail}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Housekeeping</p>
                <h3 className="text-xl font-semibold text-[var(--ink)]">Cola de limpieza</h3>
              </div>
              <Badge variant="cleaning">{housekeepingQueue.length} en curso</Badge>
            </div>
            <div className="space-y-3">
              {housekeepingQueue.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No hay habitaciones en limpieza por ahora.</p>
              ) : (
                housekeepingQueue.map((item) => (
                  <div key={item.room} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/80 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">Habitacion {item.room}</p>
                      <p className="text-xs text-[var(--ink-muted)]">{item.task}</p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--amber)]">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Llegadas</p>
                <h3 className="text-xl font-semibold text-[var(--ink)]">Check-ins hoy</h3>
              </div>
              <Badge variant="available">{arrivals.length} previstos</Badge>
            </div>
            <div className="space-y-3">
              {arrivals.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">Sin check-ins programados para hoy.</p>
              ) : (
                arrivals.map((arrival) => (
                  <div key={`${arrival.room}-${arrival.guest}`} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-black/10 bg-white/80 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{arrival.guest}</p>
                      <p className="text-xs text-[var(--ink-muted)]">Habitacion {arrival.room}</p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--teal)]">{arrival.time}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Drawer
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoomId(null)}
        title={selectedRoom ? `Habitacion ${selectedRoom.number}` : 'Habitacion'}
        subtitle={selectedRoom ? `${selectedRoom.type} · Piso ${selectedRoom.floor}` : undefined}
        footer={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                pushToast({
                  title: 'Historial abierto',
                  description: 'Consulta las ultimas estadias.',
                  variant: 'info',
                })
              }
            >
              Ver historial
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Pago registrado',
                  description: 'Se guardo el pago asociado a esta habitacion.',
                  variant: 'success',
                })
              }
            >
              Registrar pago
            </Button>
          </div>
        }
      >
        {selectedRoom ? (
          <div className="space-y-6">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Estado actual</p>
                <Badge variant={statusMeta[selectedRoom.status].badge}>{statusMeta[selectedRoom.status].label}</Badge>
              </div>
              <div className="space-y-2 text-sm text-[var(--ink-muted)]">
                <p>
                  <span className="text-[var(--ink)]">Huesped:</span> {selectedRoom.guest ?? 'Sin asignar'}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Check-in:</span> {selectedRoom.checkIn ?? '-'}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Check-out:</span> {selectedRoom.checkOut ?? '-'}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Tarifa:</span> {selectedRoom.rate}
                </p>
              </div>
            </Card>

            <Card tone="soft" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Housekeeping</p>
              <p className="text-sm text-[var(--ink-muted)]">
                {selectedRoom.housekeeping ?? 'Sin tareas asignadas para este turno.'}
              </p>
            </Card>

            <Card className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas operativas</p>
              <p className="text-sm text-[var(--ink-muted)]">
                {selectedRoom.note ?? 'No hay notas adicionales registradas.'}
              </p>
            </Card>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Proximas tareas</p>
              <div className="space-y-2">
                {roomTasks.map((task) => (
                  <div key={task.title} className="rounded-[var(--radius-sm)] border border-black/10 bg-white/85 p-3 text-sm">
                    <p className="font-semibold text-[var(--ink)]">{task.title}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{task.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
