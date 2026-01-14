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
import { diffInDays, formatLongDate } from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'
import { guests as demoGuests, type Guest as DemoGuest } from './guestsData'

export type GuestStatus = 'activo' | 'vip' | 'bloqueado'

interface GuestListItem {
  id: string
  name: string
  email: string
  phone: string
  visits: number
  lastStay: string
  status: GuestStatus
  tags: string[]
  document: string
  documentType: string
  documentNumber: string
  country: string
  nationality: string | null
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  city: string
  notes: string
}

type GuestRow = Pick<
  Tables<'guests'>,
  | 'id'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'city'
  | 'notes'
  | 'document_type'
  | 'document_number'
  | 'country'
  | 'nationality'
  | 'address'
  | 'emergency_contact_name'
  | 'emergency_contact_phone'
>

type BookingRow = Pick<Tables<'bookings'>, 'guest_id' | 'check_in_date' | 'check_out_date' | 'status'>

const statusMeta: Record<GuestStatus, { label: string; variant: BadgeVariant }> = {
  activo: { label: 'Activo', variant: 'info' },
  vip: { label: 'VIP', variant: 'available' },
  bloqueado: { label: 'Bloqueado', variant: 'danger' },
}

const allStatuses: GuestStatus[] = ['activo', 'vip', 'bloqueado']

interface GuestFormState {
  fullName: string
  documentType: string
  documentNumber: string
  country: string
  phone: string
  email: string
  city: string
  nationality: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  notes: string
}

const emptyGuestForm: GuestFormState = {
  fullName: '',
  documentType: 'CC',
  documentNumber: '',
  country: '',
  phone: '',
  email: '',
  city: '',
  nationality: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
}

function deriveGuestStatus(guest: GuestRow, visits: number): GuestStatus {
  const notes = guest.notes?.toLowerCase() ?? ''
  if (notes.includes('bloqueado') || notes.includes('no show')) {
    return 'bloqueado'
  }
  if (visits >= 3) {
    return 'vip'
  }
  return 'activo'
}

function deriveGuestTags(guest: GuestRow, visits: number, nights: number): string[] {
  const tags: string[] = []
  const notes = guest.notes?.toLowerCase() ?? ''

  if (visits >= 3) {
    tags.push('Preferente')
  }
  if (nights >= 4) {
    tags.push('Larga estadia')
  }
  if (notes.includes('late')) {
    tags.push('Late check-out')
  }
  if (notes.includes('directo')) {
    tags.push('Reserva directa')
  }

  return tags
}

function splitDocument(value: string): { type: string; number: string } {
  const parts = value.trim().split(/\s+/)
  if (parts.length <= 1) {
    return { type: 'CC', number: value }
  }
  return { type: parts[0], number: parts.slice(1).join(' ') }
}

function mapDemoGuest(guest: DemoGuest): GuestListItem {
  const document = splitDocument(guest.document)
  return {
    id: guest.id,
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    visits: guest.visits,
    lastStay: guest.lastStay,
    status: guest.status,
    tags: guest.tags,
    document: guest.document,
    documentType: document.type,
    documentNumber: document.number,
    country: '—',
    nationality: null,
    address: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    city: guest.city,
    notes: guest.notes,
  }
}

export function GuestsPage() {
  const { pushToast } = useToast()
  const queryClient = useQueryClient()
  const useDemoData = !isSupabaseConfigured
  const [selectedGuest, setSelectedGuest] = useState<GuestListItem | null>(null)
  const [guestFormOpen, setGuestFormOpen] = useState(false)
  const [guestFormMode, setGuestFormMode] = useState<'create' | 'edit'>('create')
  const [guestForm, setGuestForm] = useState<GuestFormState>(emptyGuestForm)
  const [guestFormErrors, setGuestFormErrors] = useState<Record<string, string>>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<GuestStatus[]>(allStatuses)
  const [activeTags, setActiveTags] = useState<string[]>([])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['guests', 'guest-bookings'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      if (!supabase) {
        return { guests: [], bookings: [] }
      }
      const [guestsResult, bookingsResult] = await Promise.all([
        supabase
          .from('guests')
          .select(
            [
              'id',
              'full_name',
              'email',
              'phone',
              'city',
              'notes',
              'document_type',
              'document_number',
              'country',
              'nationality',
              'address',
              'emergency_contact_name',
              'emergency_contact_phone',
            ].join(',')
          ),
        supabase
          .from('bookings')
          .select('guest_id, check_in_date, check_out_date, status'),
      ])

      if (guestsResult.error) {
        throw guestsResult.error
      }
      if (bookingsResult.error) {
        throw bookingsResult.error
      }

      return {
        guests: (guestsResult.data ?? []) as unknown as GuestRow[],
        bookings: (bookingsResult.data ?? []) as unknown as BookingRow[],
      }
    },
  })

  const guestItems = useMemo(() => {
    if (useDemoData) {
      return demoGuests.map(mapDemoGuest)
    }
    if (!data) {
      return []
    }

    const bookingsByGuest = new Map<string, BookingRow[]>()

    data.bookings.forEach((booking) => {
      const list = bookingsByGuest.get(booking.guest_id) ?? []
      list.push(booking)
      bookingsByGuest.set(booking.guest_id, list)
    })

    return data.guests.map((guest) => {
      const guestBookings = (bookingsByGuest.get(guest.id) ?? []).filter(
        (booking) => booking.status !== 'CANCELLED'
      )
      const visits = guestBookings.length
      const lastStayDate = guestBookings
        .map((booking) => booking.check_in_date)
        .filter(Boolean)
        .sort()
        .pop()
      const totalNights = guestBookings.reduce(
        (sum, booking) => sum + diffInDays(booking.check_in_date, booking.check_out_date),
        0
      )

      const status = deriveGuestStatus(guest, visits)
      const tags = deriveGuestTags(guest, visits, totalNights)

      return {
        id: guest.id,
        name: guest.full_name,
        email: guest.email,
        phone: guest.phone,
        visits,
        lastStay: formatLongDate(lastStayDate),
        status,
        tags,
        document: `${guest.document_type} ${guest.document_number}`,
        documentType: guest.document_type,
        documentNumber: guest.document_number,
        country: guest.country ?? '—',
        nationality: guest.nationality ?? null,
        address: guest.address ?? null,
        emergencyContactName: guest.emergency_contact_name ?? null,
        emergencyContactPhone: guest.emergency_contact_phone ?? null,
        city: guest.city ?? '—',
        notes: guest.notes ?? 'Sin notas registradas.',
      }
    })
  }, [data, useDemoData])

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    guestItems.forEach((guest) => {
      guest.tags.forEach((tag) => set.add(tag))
    })
    return Array.from(set).sort()
  }, [guestItems])

  useEffect(() => {
    if (availableTags.length > 0) {
      setActiveTags(availableTags)
    }
  }, [availableTags])

  const filteredGuests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return guestItems.filter((guest) => {
      const matchesStatus = activeStatuses.includes(guest.status)
      const matchesTag = activeTags.length === 0 || guest.tags.some((tag) => activeTags.includes(tag))
      const matchesQuery =
        query.length === 0 ||
        guest.name.toLowerCase().includes(query) ||
        guest.email.toLowerCase().includes(query)
      return matchesStatus && matchesTag && matchesQuery
    })
  }, [activeStatuses, activeTags, guestItems, searchTerm])

  const vipCount = guestItems.filter((guest) => guest.status === 'vip').length
  const blockedCount = guestItems.filter((guest) => guest.status === 'bloqueado').length

  const toggleStatus = (status: GuestStatus) => {
    setActiveStatuses((prev) => {
      const next = prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
      return next.length === 0 ? allStatuses : next
    })
  }

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
      return next.length === 0 ? availableTags : next
    })
  }

  const guestMutation = useMutation({
    mutationFn: async (payload: { mode: 'create' | 'edit'; id?: string; data: GuestFormState }) => {
      if (!supabase) {
        throw new Error('Supabase no configurado.')
      }
      const data = {
        full_name: payload.data.fullName.trim(),
        document_type: payload.data.documentType,
        document_number: payload.data.documentNumber.trim(),
        country: payload.data.country.trim(),
        phone: payload.data.phone.trim(),
        email: payload.data.email.trim(),
        city: payload.data.city.trim() || null,
        nationality: payload.data.nationality.trim() || null,
        address: payload.data.address.trim() || null,
        emergency_contact_name: payload.data.emergencyContactName.trim() || null,
        emergency_contact_phone: payload.data.emergencyContactPhone.trim() || null,
        notes: payload.data.notes.trim() || null,
      }

      if (payload.mode === 'create') {
        const { error } = await supabase.from('guests').insert(data)
        if (error) {
          throw error
        }
        return
      }

      if (!payload.id) {
        throw new Error('No se encontro el huesped para editar.')
      }
      const { error } = await supabase.from('guests').update(data).eq('id', payload.id)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', 'guest-bookings'] })
      pushToast({
        title: guestFormMode === 'create' ? 'Huesped creado' : 'Huesped actualizado',
        description: 'Los cambios se guardaron correctamente.',
        variant: 'success',
      })
      setGuestFormOpen(false)
      setGuestFormErrors({})
      setEditingGuestId(null)
    },
    onError: (error: Error) => {
      pushToast({
        title: 'No se pudo guardar',
        description: error.message,
        variant: 'danger',
      })
    },
  })

  const validateGuestForm = (form: GuestFormState) => {
    const errors: Record<string, string> = {}
    if (!form.fullName.trim()) {
      errors.fullName = 'Nombre obligatorio.'
    }
    if (!form.documentNumber.trim()) {
      errors.documentNumber = 'Documento obligatorio.'
    }
    if (!form.country.trim()) {
      errors.country = 'Pais obligatorio.'
    }
    if (!form.phone.trim()) {
      errors.phone = 'Telefono obligatorio.'
    }
    if (!form.email.trim()) {
      errors.email = 'Correo obligatorio.'
    }
    return errors
  }

  const openCreateGuest = () => {
    setGuestFormMode('create')
    setEditingGuestId(null)
    setGuestForm({ ...emptyGuestForm })
    setGuestFormErrors({})
    setGuestFormOpen(true)
  }

  const openEditGuest = (guest: GuestListItem) => {
    setGuestFormMode('edit')
    setEditingGuestId(guest.id)
    setGuestForm({
      fullName: guest.name,
      documentType: guest.documentType,
      documentNumber: guest.documentNumber,
      country: guest.country === '—' ? '' : guest.country,
      phone: guest.phone,
      email: guest.email,
      city: guest.city === '—' ? '' : guest.city,
      nationality: guest.nationality ?? '',
      address: guest.address ?? '',
      emergencyContactName: guest.emergencyContactName ?? '',
      emergencyContactPhone: guest.emergencyContactPhone ?? '',
      notes: guest.notes === 'Sin notas registradas.' ? '' : guest.notes,
    })
    setGuestFormErrors({})
    setGuestFormOpen(true)
  }

  const handleGuestSave = () => {
    if (!isSupabaseConfigured) {
      pushToast({
        title: 'Modo demo',
        description: 'Configura Supabase para guardar huespedes.',
        variant: 'warning',
      })
      return
    }
    const errors = validateGuestForm(guestForm)
    setGuestFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      pushToast({
        title: 'Campos incompletos',
        description: 'Revisa los campos obligatorios.',
        variant: 'warning',
      })
      return
    }
    guestMutation.mutate({ mode: guestFormMode, id: editingGuestId ?? undefined, data: guestForm })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Huespedes"
        title="Relacion de huespedes"
        description="Mantiene el historial y las notas de cada huesped sin perder el contexto de la lista."
        actions={
          <>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o correo"
              className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] md:w-72"
            />
            <Button
              variant="primary"
              onClick={openCreateGuest}
            >
              Nuevo huesped
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Huespedes" value={`${guestItems.length}`} helper="Total registrados" accent="teal" />
        <StatCard label="VIP" value={`${vipCount}`} helper="Atencion preferente" accent="navy" />
        <StatCard label="Bloqueados" value={`${blockedCount}`} helper="Requiere validacion" accent="coral" />
        <StatCard label="Ultima semana" value="—" helper="Nuevos registros" accent="amber" />
      </div>

      <Card tone="soft" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Lista activa</Badge>
          <Button variant="ghost" size="xs" onClick={() => setActiveStatuses(allStatuses)}>
            Limpiar estado
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setActiveTags(availableTags)}>
            Limpiar tags
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
          {availableTags.map((tag) => (
            <FilterChip key={tag} selected={activeTags.includes(tag)} onClick={() => toggleTag(tag)}>
              {tag}
            </FilterChip>
          ))}
        </div>
      </Card>

      {useDemoData ? <DemoNotice label="Huespedes" /> : null}

      {isLoading ? (
        <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
          Cargando huespedes...
        </Card>
      ) : isError ? (
        <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
          No se pudieron cargar los huespedes.
        </Card>
      ) : filteredGuests.length === 0 ? (
        <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
          No hay huespedes con los filtros actuales.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGuests.map((guest) => {
            const meta = statusMeta[guest.status]
            return (
              <button
                key={guest.id}
                type="button"
                onClick={() => setSelectedGuest(guest)}
                className="group rounded-[var(--radius)] border border-black/10 bg-white/85 p-5 text-left shadow-[0_18px_40px_-30px_rgba(var(--shadow),0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-28px_rgba(var(--shadow),0.6)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--ink)]">{guest.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{guest.email}</p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guest.tags.length === 0 ? (
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      Sin etiquetas
                    </span>
                  ) : (
                    guest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/10 bg-[var(--paper-soft)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  <span>{guest.visits} visitas</span>
                  <span>Ultima estadia {guest.lastStay}</span>
                  <span>{guest.city}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Drawer
        open={Boolean(selectedGuest)}
        onClose={() => setSelectedGuest(null)}
        title={selectedGuest?.name ?? 'Detalle de huesped'}
        subtitle={selectedGuest ? `Registro ${selectedGuest.id} · ${selectedGuest.city}` : undefined}
        footer={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedGuest) {
                  openEditGuest(selectedGuest)
                  setSelectedGuest(null)
                }
              }}
            >
              Editar
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                pushToast({
                  title: 'Reserva iniciada',
                  description: 'Se inicio una nueva reserva para este huesped.',
                  variant: 'info',
                })
              }
            >
              Crear reserva
            </Button>
          </div>
        }
      >
        {selectedGuest ? (
          <div className="space-y-6">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Contacto</p>
                <Badge variant={statusMeta[selectedGuest.status].variant}>{statusMeta[selectedGuest.status].label}</Badge>
              </div>
              <div className="space-y-2 text-sm text-[var(--ink-muted)]">
                <p>
                  <span className="text-[var(--ink)]">Correo:</span> {selectedGuest.email}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Telefono:</span> {selectedGuest.phone}
                </p>
                <p>
                  <span className="text-[var(--ink)]">Documento:</span> {selectedGuest.documentType} {selectedGuest.documentNumber}
                </p>
              </div>
            </Card>

            <Card tone="soft" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Preferencias</p>
              <div className="flex flex-wrap gap-2">
                {selectedGuest.tags.length === 0 ? (
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Sin etiquetas
                  </span>
                ) : (
                  selectedGuest.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            <Card tone="soft" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas operativas</p>
              <p className="text-sm text-[var(--ink-muted)]">{selectedGuest.notes}</p>
            </Card>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={guestFormOpen}
        onClose={() => setGuestFormOpen(false)}
        title={guestFormMode === 'create' ? 'Nuevo huesped' : 'Editar huesped'}
        subtitle={guestFormMode === 'create' ? 'Registro completo del huesped' : 'Actualiza datos del huesped'}
        footer={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setGuestFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGuestSave}>
              {guestMutation.isPending ? 'Guardando...' : 'Guardar huesped'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Nombre completo</label>
                <input
                  value={guestForm.fullName}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {guestFormErrors.fullName ? (
                  <p className="text-xs text-[var(--coral)]">{guestFormErrors.fullName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Pais</label>
                <input
                  value={guestForm.country}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, country: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {guestFormErrors.country ? (
                  <p className="text-xs text-[var(--coral)]">{guestFormErrors.country}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Tipo documento</label>
                <select
                  value={guestForm.documentType}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, documentType: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="PASSPORT">PASSPORT</option>
                  <option value="PEP">PEP</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Numero documento</label>
                <input
                  value={guestForm.documentNumber}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, documentNumber: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {guestFormErrors.documentNumber ? (
                  <p className="text-xs text-[var(--coral)]">{guestFormErrors.documentNumber}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Telefono</label>
                <input
                  value={guestForm.phone}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {guestFormErrors.phone ? (
                  <p className="text-xs text-[var(--coral)]">{guestFormErrors.phone}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Correo</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
                {guestFormErrors.email ? (
                  <p className="text-xs text-[var(--coral)]">{guestFormErrors.email}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Ciudad</label>
                <input
                  value={guestForm.city}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, city: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Nacionalidad</label>
                <input
                  value={guestForm.nationality}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, nationality: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Direccion</label>
              <textarea
                rows={2}
                value={guestForm.address}
                onChange={(event) => setGuestForm((prev) => ({ ...prev, address: event.target.value }))}
                className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
              />
            </div>
          </Card>

          <Card tone="soft" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Contacto emergencia</label>
                <input
                  value={guestForm.emergencyContactName}
                  onChange={(event) => setGuestForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Telefono emergencia</label>
                <input
                  value={guestForm.emergencyContactPhone}
                  onChange={(event) =>
                    setGuestForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))
                  }
                  className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notas</label>
              <textarea
                rows={3}
                value={guestForm.notes}
                onChange={(event) => setGuestForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full rounded-[var(--radius-sm)] border border-black/10 bg-white/90 px-3 py-2 text-sm"
              />
            </div>
          </Card>
        </div>
      </Drawer>
    </div>
  )
}
