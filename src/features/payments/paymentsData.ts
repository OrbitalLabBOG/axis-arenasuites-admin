export type PaymentStatus = 'recibido' | 'pendiente' | 'reembolsado'

export interface Payment {
  id: string
  booking: string
  guest: string
  date: string
  method: string
  channel: string
  amount: string
  status: PaymentStatus
}

export const payments: Payment[] = [
  {
    id: 'PAY-2301',
    booking: 'AS-1041',
    guest: 'Juliana Marin',
    date: 'Jul 08, 2025',
    method: 'Tarjeta',
    channel: 'Booking',
    amount: '$640.000',
    status: 'recibido',
  },
  {
    id: 'PAY-2302',
    booking: 'AS-1042',
    guest: 'Santiago Ruiz',
    date: 'Jul 08, 2025',
    method: 'Transferencia',
    channel: 'Directo',
    amount: '$320.000',
    status: 'pendiente',
  },
  {
    id: 'PAY-2303',
    booking: 'AS-1043',
    guest: 'Ana Gomez',
    date: 'Jul 09, 2025',
    method: 'Efectivo',
    channel: 'Expedia',
    amount: '$960.000',
    status: 'recibido',
  },
  {
    id: 'PAY-2304',
    booking: 'AS-1044',
    guest: 'Carlos Rios',
    date: 'Jul 09, 2025',
    method: 'Tarjeta',
    channel: 'Parque 63',
    amount: '$580.000',
    status: 'pendiente',
  },
  {
    id: 'PAY-2305',
    booking: 'AS-1040',
    guest: 'Natalia Torres',
    date: 'Jul 07, 2025',
    method: 'Transferencia',
    channel: 'Directo',
    amount: '$1.200.000',
    status: 'reembolsado',
  },
]
