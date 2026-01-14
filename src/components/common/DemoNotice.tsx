import { Card } from '@/components/ui/Card'

export function DemoNotice({ label }: { label: string }) {
  return (
    <Card tone="soft" className="text-sm text-[var(--ink-muted)]">
      {label} · Modo demo activo. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `frontend-admin/.env` para ver datos reales.
    </Card>
  )
}
