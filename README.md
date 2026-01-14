# Arena Suites - Admin Dashboard

Sistema de gestión hotelera para Arena Suites, Bogotá.

## Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS v4**
- **Supabase** (backend)
- **React Query** (data fetching)

## Funcionalidades

- **Dashboard**: KPIs, llegadas/salidas, alertas
- **Habitaciones**: Estado por piso, ocupación
- **Reservas**: Agenda semanal, CRUD completo
- **Huéspedes**: Registro, historial, tags
- **Pagos**: Ingresos, estados, métodos

## Deploy en Vercel

### 1. Conectar Repo

1. Ir a [vercel.com](https://vercel.com)
2. Import Project → Seleccionar este repo
3. Framework: Vite (auto-detectado)

### 2. Variables de Entorno

Agregar en Vercel → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://dlvzvztvqpagaiqkulhr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Deploy

Click "Deploy" - Vercel hace el resto automáticamente.

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor
npm run dev

# Build producción
npm run build
```

## Supabase

**Proyecto:** Arena Suites (us-east-2)  
**Ref:** `dlvzvztvqpagaiqkulhr`

---

**Orbital Lab** | 2026
