export type BookingStatus = 'confirmada' | 'pendiente' | 'check-in' | 'check-out' | 'cancelada'

export interface BookingItem {
  id: string
  guest: string
  room: string
  checkIn: string
  checkOut: string
  nights: number
  status: BookingStatus
  channel: string
  total: string
  note?: string
}

export interface BookingDay {
  label: string
  date: string
  isToday?: boolean
  bookings: BookingItem[]
}

export const bookingDays: BookingDay[] = [
  {
    label: 'Lun 08',
    date: 'Jul 08',
    isToday: true,
    bookings: [
      {
        id: 'AS-1041',
        guest: 'Juliana Marin',
        room: '202',
        checkIn: '2:00 PM',
        checkOut: '11:00 AM',
        nights: 2,
        status: 'check-in',
        channel: 'Booking',
        total: '$640.000',
        note: 'Pago parcial',
      },
      {
        id: 'AS-1042',
        guest: 'Santiago Ruiz',
        room: '206',
        checkIn: '4:00 PM',
        checkOut: '11:00 AM',
        nights: 1,
        status: 'confirmada',
        channel: 'Directo',
        total: '$320.000',
      },
    ],
  },
  {
    label: 'Mar 09',
    date: 'Jul 09',
    bookings: [
      {
        id: 'AS-1043',
        guest: 'Ana Gomez',
        room: '305',
        checkIn: '1:00 PM',
        checkOut: '11:00 AM',
        nights: 3,
        status: 'confirmada',
        channel: 'Expedia',
        total: '$960.000',
      },
      {
        id: 'AS-1044',
        guest: 'Carlos Rios',
        room: '212',
        checkIn: '6:00 PM',
        checkOut: '12:00 PM',
        nights: 2,
        status: 'pendiente',
        channel: 'Parque 63',
        total: '$580.000',
      },
    ],
  },
  {
    label: 'Mie 10',
    date: 'Jul 10',
    bookings: [
      {
        id: 'AS-1045',
        guest: 'Laura Jaramillo',
        room: '214',
        checkIn: '3:00 PM',
        checkOut: '11:00 AM',
        nights: 1,
        status: 'confirmada',
        channel: 'Directo',
        total: '$340.000',
      },
    ],
  },
  {
    label: 'Jue 11',
    date: 'Jul 11',
    bookings: [
      {
        id: 'AS-1046',
        guest: 'Natalia Torres',
        room: '310',
        checkIn: '2:30 PM',
        checkOut: '11:30 AM',
        nights: 4,
        status: 'confirmada',
        channel: 'Booking',
        total: '$1.280.000',
      },
    ],
  },
  {
    label: 'Vie 12',
    date: 'Jul 12',
    bookings: [
      {
        id: 'AS-1047',
        guest: 'Martin Perez',
        room: '303',
        checkIn: '5:00 PM',
        checkOut: '12:00 PM',
        nights: 2,
        status: 'check-out',
        channel: 'Directo',
        total: '$720.000',
      },
      {
        id: 'AS-1048',
        guest: 'Valentina Mora',
        room: '209',
        checkIn: '6:30 PM',
        checkOut: '11:00 AM',
        nights: 1,
        status: 'pendiente',
        channel: 'Expedia',
        total: '$300.000',
        note: 'Esperando confirmacion',
      },
    ],
  },
]
