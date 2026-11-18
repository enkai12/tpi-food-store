import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RegisterPage, UnauthorizedPage } from '@/features/auth'
import { CarritoPage, CheckoutPage, MisPedidosPage } from '@/features/pedidos'
import { CatalogoPage } from '@/features/productos'
import AdminLayout from '@/shared/layout/AdminLayout'
import MainLayout from '@/shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

// El panel se descarga recién cuando el admin entra: un cliente no baja ese código, ni
// TanStack Table (H100). Cada import() es un archivo aparte que Vite separa del principal.
// Van directo al archivo de la página y no por el barrel (excepción a H76): si el barrel las
// exportara, como el resto de la app lo importa al inicio, el panel volvería al principal
const AdminResumenPage = lazy(() => import('@/features/pedidos/pages/AdminResumenPage'))
const AdminCategoriasPage = lazy(() => import('@/features/categorias/pages/AdminCategoriasPage'))
const AdminProductosPage = lazy(() => import('@/features/productos/pages/AdminProductosPage'))
const AdminPedidosPage = lazy(() => import('@/features/pedidos/pages/AdminPedidosPage'))
const AdminUsuariosPage = lazy(() => import('@/features/usuarios/pages/AdminUsuariosPage'))

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
              <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
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
