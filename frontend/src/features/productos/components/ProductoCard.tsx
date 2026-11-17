import { useState } from 'react'
import Card from '@/shared/ui/Card'
import { formatearPrecio } from '@/shared/utils/formato'
import type { Producto } from '../types/producto'

function ProductoCard({ producto }: { producto: Producto }) {
  // Si la imagen no carga (URL rota o sin conexión), muestro lo mismo que sin imagen
  const [falloImagen, setFalloImagen] = useState(false)
  const imagen = falloImagen ? null : producto.imagen_url
  // Se muestran igual, marcados: el backend rechazaría el pedido (RN-01)
  const aviso = !producto.disponible ? 'No disponible' : producto.stock === 0 ? 'Sin stock' : null

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {imagen ? (
        // alt vacío: el nombre ya está escrito debajo y el lector no lo repite.
        // lazy: las imágenes de abajo se piden recién al acercarse con el scroll
        <img
          src={imagen}
          alt=""
          loading="lazy"
          onError={() => setFalloImagen(true)}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="flex h-40 items-center justify-center bg-stone-100 text-5xl">
          🍽️
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
          {producto.categoria.nombre}
        </p>
        <h2 className="font-semibold text-stone-900">{producto.nombre}</h2>
        {producto.descripcion && <p className="text-sm text-stone-600">{producto.descripcion}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-lg font-bold text-red-700">{formatearPrecio(producto.precio_base)}</span>
          {aviso && (
            <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-stone-700">
              {aviso}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ProductoCard
