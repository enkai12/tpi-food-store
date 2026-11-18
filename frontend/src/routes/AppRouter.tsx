import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RegisterPage, UnauthorizedPage } from '@/features/auth'
import { AdminCategoriasPage } from '@/features/categorias'
import { AdminResumenPage, CarritoPage, CheckoutPage, MisPedidosPage } from '@/features/pedidos'
import { AdminProductosPage, CatalogoPage } from '@/features/productos'
import AdminLayout from '@/shared/layout/AdminLayout'
import MainLayout from '@/shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

// Provisorio: ocupa las pantallas que todavía no existen (las reemplaza el paso 25), así la
// tabla de rutas y su protección quedan completas desde ahora
function EnConstruccion({ titulo }: { titulo: string }) {
  return <h1 className="text-2xl font-bold text-stone-900">{titulo}</h1>
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todas las pantallas comparten la Navbar */}
        <Route element={<MainLayout />}>
          {/* Públicas */}
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Con sesión, cualquier rol */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          {/* Solo admin, con las secciones del panel arriba (AdminLayout) */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/resumen" element={<AdminResumenPage />} />
              <Route path="/admin/categorias" element={<AdminCategoriasPage />} />
              <Route path="/admin/productos" element={<AdminProductosPage />} />
              <Route path="/admin/pedidos" element={<EnConstruccion titulo="Pedidos" />} />
              <Route path="/admin/usuarios" element={<EnConstruccion titulo="Usuarios" />} />
            </Route>
          </Route>

          {/* Una dirección que no existe vuelve al catálogo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
