import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export function Topbar() {
  const { pushToast } = useToast()
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-black/10 bg-white/75 px-6 py-4 shadow-[0_18px_40px_-30px_rgba(var(--shadow),0.5)] md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Hotel arena suites</p>
        <p className="text-sm font-semibold text-[var(--ink)]">Tablero operativo</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <input
          type="search"
          placeholder="Buscar reserva, huesped o habitacion"
          className="w-full rounded-full border border-black/10 bg-[var(--paper-soft)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              pushToast({
                title: 'Nueva reserva',
                description: 'Formulario listo para iniciar una reserva.',
                variant: 'info',
              })
            }
          >
            Nueva reserva
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              pushToast({
                title: 'Registrar pago',
                description: 'Formulario listo para registrar un pago.',
                variant: 'success',
              })
            }
          >
            Registrar pago
          </Button>
        </div>
      </div>
    </div>
  )
}
