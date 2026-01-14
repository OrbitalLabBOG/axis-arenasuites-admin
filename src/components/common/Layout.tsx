import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-transparent lg:flex">
      <div className="lg:w-64">
        <Sidebar />
      </div>
      <main className="flex-1 space-y-8 px-6 py-6 lg:px-10 lg:py-8">
        <Topbar />
        <Outlet />
      </main>
    </div>
  )
}
