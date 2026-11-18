import { Link, NavLink, useNavigate } from 'react-router-dom'
import { NOMBRE_ROL } from '@/features/auth'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

// NavLink marca el enlace de la página actual (y le pone aria-current="page")
const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 hover:bg-red-800 ${isActive ? 'bg-red-800 font-semibold' : ''}`

function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const enCarrito = useCartStore((s) => s.cantidadTotal())
  const navigate = useNavigate()

  async function cerrarSesion() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-red-700 text-white shadow">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3"
      >
        <Link to="/" className="text-xl font-bold">
          Food Store
        </Link>

        <ul className="flex flex-wrap items-center gap-1 text-sm">
          <li>
            {/* end: «/» activo solo en el catálogo, no en todas las rutas */}
            <NavLink to="/" end className={claseEnlace}>
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/carrito"
              className={claseEnlace}
              aria-label={enCarrito > 0 ? `Carrito, ${enCarrito} productos` : 'Carrito'}
            >
              Carrito
              {enCarrito > 0 && (
                <span className="ml-1.5 rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-red-700">
                  {enCarrito}
                </span>
              )}
            </NavLink>
          </li>
          {usuario && (
            <li>
              <NavLink to="/mis-pedidos" className={claseEnlace}>
                Mis pedidos
              </NavLink>
            </li>
          )}
          {/* Solo se muestra al admin, pero lo que protege el panel es el backend */}
          {usuario?.role === 'admin' && (
            <li>
              <NavLink to="/admin" className={claseEnlace}>
                Panel
              </NavLink>
            </li>
          )}
        </ul>

        <div className="flex items-center gap-3 text-sm">
          {usuario ? (
            <>
              <span>
                {usuario.full_name}
                <span className="ml-2 rounded bg-red-900 px-2 py-0.5 text-xs">
                  {NOMBRE_ROL[usuario.role]}
                </span>
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="whitespace-nowrap rounded border border-white/60 px-3 py-1 font-semibold hover:bg-red-800"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={claseEnlace}>
                Ingresar
              </NavLink>
              <NavLink to="/register" className={claseEnlace}>
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
