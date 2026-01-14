import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/common/Layout'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { BookingsPage } from '@/features/bookings/BookingsPage'
import { GuestsPage } from '@/features/guests/GuestsPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RoomsPage />} />
          <Route path="operacion" element={<DashboardPage />} />
          <Route path="reservas" element={<BookingsPage />} />
          <Route path="huespedes" element={<GuestsPage />} />
          <Route path="pagos" element={<PaymentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
