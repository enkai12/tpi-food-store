import Button from '@/shared/ui/Button'

interface PaginacionProps {
  pagina: number // la actual, empezando en 1
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

// Sirve para las dos paginaciones: la del catálogo (la hace el backend con skip y limit) y
// la de las tablas del panel (la hace TanStack Table en el navegador)
function Paginacion({ pagina, totalPaginas, onCambiar }: PaginacionProps) {
  // Con una sola página no hay nada que elegir
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-4">
      <Button variante="secundario" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        Anterior
      </Button>
      <span className="text-sm text-stone-600" aria-live="polite">
        Página {pagina} de {totalPaginas}
      </span>
      <Button
        variante="secundario"
        disabled={pagina >= totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente
      </Button>
    </nav>
  )
}

export default Paginacion
