import type { HTMLAttributes } from 'react'

// Una caja blanca con borde: las tarjetas del catálogo, del resumen y de los pedidos.
// className reemplaza el padding por defecto (p-4): si se sumaran p-4 y p-0, las dos clases
// convivirían y ganaría la que Tailwind escribe después en el CSS, no la que se pasó
function Card({ className = 'p-4', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-stone-200 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
