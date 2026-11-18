import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RegisterPage, UnauthorizedPage } from '@/features/auth'
import { AdminCategoriasPage } from '@/features/categorias'
import {
  AdminPedidosPage,
  AdminResumenPage,
  CarritoPage,
  CheckoutPage,
  MisPedidosPage,
} from '@/features/pedidos'
import { AdminProductosPage, CatalogoPage } from '@/features/productos'
import { AdminUsuariosPage } from '@/features/usuarios'
import AdminLayout from '@/shared/layout/AdminLayout'
import MainLayout from '@/shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

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
