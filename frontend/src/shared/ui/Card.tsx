import type { HTMLAttributes } from 'react'

// Una caja blanca con borde: las tarjetas del catálogo, del resumen y de los pedidos
function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-stone-200 bg-white p-4 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
