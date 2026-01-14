export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance'

export interface Room {
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

const statusCycle: RoomStatus[] = [
  'occupied',
  'available',
  'cleaning',
  'occupied',
  'maintenance',
  'available',
  'occupied',
  'cleaning',
]

const guestNames = [
  'Juliana Marin',
  'Carlos Rios',
  'Ana Gomez',
  'Martin Perez',
  'Laura Jaramillo',
  'Santiago Ruiz',
  'Valentina Mora',
  'Andres Mejia',
  'Natalia Torres',
]

const channels = ['Directo', 'Booking', 'Expedia', 'Parque 63']

const datePairs = [
  ['Jul 06', 'Jul 09'],
  ['Jul 05', 'Jul 08'],
  ['Jul 07', 'Jul 10'],
  ['Jul 04', 'Jul 06'],
  ['Jul 08', 'Jul 11'],
  ['Jul 03', 'Jul 05'],
]

const rates = ['$320.000', '$280.000', '$360.000', '$420.000']

const housekeepingNotes = [
  'Lista desde 10:30',
  'Limpieza en curso',
  'Inspeccion final',
  'Toallas pendientes',
]

const maintenanceNotes = ['Revision de ducha', 'Ajuste de aire', 'Cambio de cortinas']

const buildRooms = (): Room[] => {
  const numbers: number[] = []
  for (let i = 0; i < 14; i += 1) {
    numbers.push(201 + i)
  }
  for (let i = 0; i < 14; i += 1) {
    numbers.push(301 + i)
  }

  return numbers.map((num, index) => {
    const status = statusCycle[index % statusCycle.length]
    const guest = status === 'occupied' ? guestNames[index % guestNames.length] : undefined
    const [checkIn, checkOut] = datePairs[index % datePairs.length]
    const housekeeping =
      status === 'available' || status === 'cleaning'
        ? housekeepingNotes[index % housekeepingNotes.length]
        : undefined

    return {
      number: String(num),
      floor: num >= 300 ? 3 : 2,
      status,
      type: 'Habitacion',
      rate: rates[index % rates.length],
      guest,
      checkIn: guest ? checkIn : undefined,
      checkOut: guest ? checkOut : status === 'cleaning' ? checkOut : undefined,
      channel: guest ? channels[index % channels.length] : undefined,
      housekeeping,
      note: status === 'maintenance' ? maintenanceNotes[index % maintenanceNotes.length] : undefined,
    }
  })
}

export const rooms = buildRooms()
