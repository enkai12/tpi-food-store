import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProductosPorId } from '@/features/productos'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Modal from '@/shared/ui/Modal'
import { formatearPrecio } from '@/shared/utils/formato'
import { subtotal, useCartStore } from '@/store/cartStore'

function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  // Las acciones no cambian nunca: las tomo una vez, sin suscribirme
  const { quitar, cambiarCantidad, vaciar, actualizarDatos } = useCartStore.getState()
  const navigate = useNavigate()
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)

  // Los datos actuales de cada producto: el carrito pudo armarse hace días
  const consultas = useProductosPorId(items.map((i) => i.producto_id))

  // Cuando llegan, actualizo nombre, precio y stock en el store (y en localStorage).
  // actualizarDatos no escribe si nada cambió, así que el efecto no entra en un ciclo
  useEffect(() => {
    for (const consulta of consultas) {
      if (consulta.data) actualizarDatos(consulta.data)
    }
  }, [consultas, actualizarDatos])

  // Qué impide pedir el ítem, según lo que respondió el backend (las consultas van en el mismo
  // orden que los ítems)
  function problema(indice: number): string | null {
    const consulta = consultas[indice]
    const item = items[indice]
    if (!consulta || !item) return null
    if (consulta.isError) {
      const status = axios.isAxiosError(consulta.error) ? consulta.error.response?.status : undefined
      // Un 404 es que el admin lo dio de baja. Sin conexión no se sabe: no lo bloqueo, y si
      // hay un problema, lo dirá el backend al confirmar
      return status === 404 ? 'Ya no está en el catálogo' : null
    }
    const producto = consulta.data
    if (!producto) return null
    if (!producto.disponible) return 'No disponible por ahora'
    if (producto.stock === 0) return 'Sin stock'
    if (item.cantidad > producto.stock) return `Solo quedan ${producto.stock}`
    return null
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-stone-900">Carrito</h1>
        <EstadoVacio mensaje="Tu carrito está vacío.">
          <Link to="/" className="font-semibold text-red-700 hover:underline">
            Ver el catálogo
          </Link>
        </EstadoVacio>
      </div>
    )
  }

  const verificando = consultas.some((c) => c.isPending)
  const hayProblemas = items.some((_, i) => problema(i) !== null)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Carrito</h1>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <ul className="space-y-3">
          {items.map((item, i) => {
            const aviso = problema(i)
            return (
              <li key={item.producto_id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-stone-900">{item.nombre}</h2>
                    <p className="text-sm text-stone-600">{formatearPrecio(item.precio_unitario)} c/u</p>
                    {aviso && <p className="mt-1 text-sm font-semibold text-red-700">{aviso}</p>}
                  </div>
                  {/* − cantidad +: el nombre accesible de cada botón dice qué producto cambia */}
                  <div className="flex items-center gap-2">
                    <Button
                      variante="secundario"
                      aria-label={`Quitar uno de ${item.nombre}`}
                      disabled={item.cantidad <= 1}
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                    >
                      −
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                    <Button
                      variante="secundario"
                      aria-label={`Agregar uno de ${item.nombre}`}
                      disabled={item.cantidad >= item.stock}
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                    >
                      +
                    </Button>
                  </div>
                  {/* ml-auto: cuando baja de línea (en el celular), queda a la derecha */}
                  <div className="ml-auto flex items-center gap-3">
                    <span className="w-24 text-right font-semibold">{formatearPrecio(subtotal(item))}</span>
                    <Button
                      variante="peligro"
                      aria-label={`Quitar ${item.nombre} del carrito`}
                      onClick={() => quitar(item.producto_id)}
                    >
                      Quitar
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>

        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span aria-live="polite">{formatearPrecio(total)}</span>
          </div>
          {hayProblemas && (
            <p role="alert" className="text-sm text-red-700">
              Revisá los productos marcados antes de confirmar.
            </p>
          )}
          {/* /checkout pide sesión: sin sesión, ProtectedRoute manda al login y después vuelve */}
          <Button
            className="w-full"
            cargando={verificando}
            disabled={hayProblemas}
            onClick={() => navigate('/checkout')}
          >
            Confirmar pedido
          </Button>
          <Button variante="secundario" className="w-full" onClick={() => setConfirmarVaciar(true)}>
            Vaciar carrito
          </Button>
        </Card>
      </div>

      <Modal abierto={confirmarVaciar} titulo="¿Vaciar el carrito?" onCerrar={() => setConfirmarVaciar(false)}>
        <p className="mb-6 text-stone-600">Se van a quitar todos los productos.</p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setConfirmarVaciar(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              vaciar()
              setConfirmarVaciar(false)
            }}
          >
            Vaciar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default CarritoPage
