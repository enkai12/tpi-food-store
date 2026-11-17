import { Link } from 'react-router-dom'

// Llega acá quien tiene sesión pero no el rol que pide la ruta
function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Sin permiso</h1>
      <p className="mb-6 text-stone-600">Tu usuario no tiene permiso para ver esta página.</p>
      <Link to="/" className="font-semibold text-red-700 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}

export default UnauthorizedPage
