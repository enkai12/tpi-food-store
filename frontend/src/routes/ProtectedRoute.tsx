import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Rol } from '../features/auth/types/auth'
import Skeleton from '../shared/components/Skeleton'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  roles?: Rol[] // si no viene, alcanza con tener sesión
}

// Envuelve un grupo de rutas: si se cumple, muestra la ruta hija con <Outlet />. Ocultar un
// botón no protege nada: la protección real es require_role en el backend
function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const { pathname, search } = useLocation()

  // Mientras /auth/me confirma la sesión todavía no sé si dejarlo pasar
  if (cargando) return <Skeleton />
  // replace: el login reemplaza a esta ruta en el historial, así «Atrás» no vuelve acá.
  // desde: después del login vuelve a la ruta que se quería ver
  if (!usuario) return <Navigate to="/login" replace state={{ desde: pathname + search }} />
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}

export default ProtectedRoute
