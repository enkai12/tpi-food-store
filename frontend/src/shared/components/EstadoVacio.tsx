import type { ReactNode } from 'react'

interface EstadoVacioProps {
  mensaje: string
  children?: ReactNode // una acción opcional, como un enlace «Ir al catálogo»
}

function EstadoVacio({ mensaje, children }: EstadoVacioProps) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
      <p className="text-stone-500">{mensaje}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default EstadoVacio
