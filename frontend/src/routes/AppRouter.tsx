import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage'
import MainLayout from '../shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

// Provisorio: ocupa las pantallas que todavía no existen. Cada paso (20 a 25) reemplaza la
// suya, así la tabla de rutas y su protección quedan completas desde ahora
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
          <Route path="/" element={<EnConstruccion titulo="Catálogo" />} />
          <Route path="/carrito" element={<EnConstruccion titulo="Carrito" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Con sesión, cualquier rol */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<EnConstruccion titulo="Confirmar pedido" />} />
            <Route path="/mis-pedidos" element={<EnConstruccion titulo="Mis pedidos" />} />
          </Route>

          {/* Solo admin */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
            <Route path="/admin/resumen" element={<EnConstruccion titulo="Resumen" />} />
            <Route path="/admin/categorias" element={<EnConstruccion titulo="Categorías" />} />
            <Route path="/admin/productos" element={<EnConstruccion titulo="Productos" />} />
            <Route path="/admin/pedidos" element={<EnConstruccion titulo="Pedidos" />} />
            <Route path="/admin/usuarios" element={<EnConstruccion titulo="Usuarios" />} />
          </Route>

          {/* Una dirección que no existe vuelve al catálogo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
