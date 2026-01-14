export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  visits: number
  lastStay: string
  status: 'activo' | 'vip' | 'bloqueado'
  tags: string[]
  document: string
  city: string
  notes: string
}

export const guests: Guest[] = [
  {
    id: 'G-201',
    name: 'Juliana Marin',
    email: 'juliana.marin@email.com',
    phone: '+57 310 555 1040',
    visits: 4,
    lastStay: 'Jun 28, 2025',
    status: 'vip',
    tags: ['Preferente', 'Pago puntual'],
    document: 'CC 1023456789',
    city: 'Medellin',
    notes: 'Prefiere habitaciones interiores y check-in temprano.',
  },
  {
    id: 'G-202',
    name: 'Carlos Rios',
    email: 'carlos.rios@email.com',
    phone: '+57 312 555 4470',
    visits: 2,
    lastStay: 'Jul 01, 2025',
    status: 'activo',
    tags: ['Reserva directa'],
    document: 'CC 794512310',
    city: 'Bogota',
    notes: 'Solicita parqueadero y factura electronica.',
  },
  {
    id: 'G-203',
    name: 'Ana Gomez',
    email: 'ana.gomez@email.com',
    phone: '+57 300 444 2031',
    visits: 1,
    lastStay: 'Jun 12, 2025',
    status: 'activo',
    tags: ['Primera visita'],
    document: 'CE 5544001',
    city: 'Cali',
    notes: 'Pidio cuna para bebe en la ultima estadia.',
  },
  {
    id: 'G-204',
    name: 'Natalia Torres',
    email: 'natalia.torres@email.com',
    phone: '+57 315 777 9940',
    visits: 3,
    lastStay: 'Jul 05, 2025',
    status: 'activo',
    tags: ['Pago mixto'],
    document: 'CC 114509998',
    city: 'Barranquilla',
    notes: 'Prefiere cama king y late check-out cuando hay disponibilidad.',
  },
  {
    id: 'G-205',
    name: 'Santiago Ruiz',
    email: 'santiago.ruiz@email.com',
    phone: '+57 318 222 1120',
    visits: 1,
    lastStay: 'May 30, 2025',
    status: 'bloqueado',
    tags: ['No show'],
    document: 'CC 441122990',
    city: 'Pereira',
    notes: 'Se requiere pago anticipado para nuevas reservas.',
  },
]
