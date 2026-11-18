import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Skeleton from '@/shared/components/Skeleton'

const SECCIONES = [
  { ruta: '/admin/resumen', texto: 'Resumen' },
  { ruta: '/admin/categorias', texto: 'Categorías' },
  { ruta: '/admin/productos', texto: 'Productos' },
  { ruta: '/admin/pedidos', texto: 'Pedidos' },
  { ruta: '/admin/usuarios', texto: 'Usuarios' },
]

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-red-700 text-white' : 'text-stone-700 hover:bg-stone-200'
  }`

// Las secciones del panel, arriba de cada pantalla del admin. Va adentro de MainLayout (la
// Navbar sigue) y de la ruta protegida por rol: solo la ve el admin
function AdminLayout() {
  return (
    <div>
      {/* overflow-x-auto: en el celular las cinco secciones se deslizan sin romper la página.
          El borde va en la nav, que no se desliza; en el celular ocupa todo el ancho */}
      <nav
        aria-label="Panel de administración"
        className="-mx-4 mb-6 overflow-x-auto border-b border-stone-200 px-4 pb-2 sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-1">
          {SECCIONES.map((s) => (
            <li key={s.ruta}>
              <NavLink to={s.ruta} className={claseEnlace}>
                {s.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Las pantallas del panel se cargan aparte (lazy en AppRouter). Mientras llega la primera
          vez, las secciones quedan arriba y abajo se ve un skeleton */}
      <Suspense fallback={<Skeleton cantidad={4} alto="h-12" />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default AdminLayout
