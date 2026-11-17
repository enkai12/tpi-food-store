interface SkeletonProps {
  cantidad?: number // cuántos bloques grises
  alto?: string // la clase de alto de cada bloque: h-12 una fila, h-64 una tarjeta
  className?: string // cómo se acomodan: una columna o una grilla
}

// Bloques grises que laten mientras llegan los datos, con la forma aproximada de lo que va
// a aparecer: así la página no salta cuando carga
function Skeleton({ cantidad = 3, alto = 'h-12', className = 'space-y-3' }: SkeletonProps) {
  return (
    <div role="status" aria-label="Cargando" className={className}>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className={`${alto} animate-pulse rounded-lg bg-stone-200`} />
      ))}
    </div>
  )
}

export default Skeleton
