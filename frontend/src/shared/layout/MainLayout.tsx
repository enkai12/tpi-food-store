import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// La Navbar arriba y, debajo, la pantalla de la ruta actual (<Outlet />)
function MainLayout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
