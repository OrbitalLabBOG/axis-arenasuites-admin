import { NavLink } from 'react-router-dom'
import { Calendar, Hotel, LayoutDashboard, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

const navItems = [
  { label: 'Habitaciones', to: '/', icon: Hotel },
  { label: 'Operacion', to: '/operacion', icon: LayoutDashboard },
  { label: 'Reservas', to: '/reservas', icon: Calendar },
  { label: 'Huespedes', to: '/huespedes', icon: Users },
  { label: 'Pagos', to: '/pagos', icon: Wallet },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col gap-8 bg-[var(--paper-soft)] px-6 py-8 shadow-[0_20px_40px_-30px_rgba(var(--shadow),0.5)] lg:w-64">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Arena Suites</p>
        <h2 className="text-2xl font-semibold text-[var(--ink)]">Recepcion</h2>
        <Badge variant="info" className="w-fit">
          Operacion activa
        </Badge>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-[var(--teal)] text-white shadow-[0_12px_25px_-20px_rgba(var(--shadow),0.7)]'
                  : 'text-[var(--ink-muted)] hover:bg-white/70 hover:text-[var(--ink)]'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Card tone="soft" className="mt-auto space-y-3 text-xs text-[var(--ink-muted)]">
        <p className="uppercase tracking-[0.2em]">Turno</p>
        <p className="text-sm font-semibold text-[var(--ink)]">Recepcion dia</p>
        <p>07:00 - 15:00</p>
        <div className="rounded-[var(--radius-sm)] border border-black/10 bg-white/80 px-3 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
          18 habitaciones activas
        </div>
      </Card>
    </aside>
  )
}
