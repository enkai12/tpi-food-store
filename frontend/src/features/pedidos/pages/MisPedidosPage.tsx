import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Paginacion from '@/shared/components/Paginacion'
import Skeleton from '@/shared/components/Skeleton'
import BadgeEstado from '@/shared/ui/BadgeEstado'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Modal from '@/shared/ui/Modal'
import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { leerEntero } from '@/shared/utils/url'
import PedidoDetalle from '../components/PedidoDetalle'
import { useCancelarPedido } from '../hooks/useCancelarPedido'
import { usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido'

const POR_PAGINA = 5

function MisPedidosPage() {
  // La página vive en la URL (?pagina=2), como en el catálogo
  const [params, setParams] = useSearchParams()
  const pagina = leerEntero(params.get('pagina')) ?? 1
  // El checkout llega con el id del pedido nuevo: lo aviso y lo muestro abierto
  const creado = (useLocation().state as { creado?: number } | null)?.creado
  const [abierto, setAbierto] = useState<number | null>(creado ?? null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)

  // propios: true, aunque quien mira sea admin: acá van solo los suyos (H89)
  const pedidos = usePedidos({ skip: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA, propios: true })
  const cancelar = useCancelarPedido()

  function cambiarPagina(nueva: number) {
    setParams(nueva > 1 ? { pagina: String(nueva) } : {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function confirmarCancelacion() {
    if (!aCancelar) return
    // Con éxito o con error se cierra: el resultado se avisa arriba de la lista
    cancelar.mutate(aCancelar.id, { onSettled: () => setACancelar(null) })
  }

  function contenido() {
    if (pedidos.isPending) return <Skeleton cantidad={3} alto="h-28" />
    if (pedidos.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(pedidos.error, 'No se pudieron cargar tus pedidos')}
          onReintentar={() => pedidos.refetch()}
        />
      )
    }
    const { total, items } = pedidos.data
    if (items.length === 0) {
      // Hay pedidos, pero no en esta página (por ejemplo, ?pagina=99 escrito a mano)
      if (total > 0) {
        return (
          <EstadoVacio mensaje="Esta página no existe.">
            <Button variante="secundario" onClick={() => cambiarPagina(1)}>
              Ir a la primera página
            </Button>
          </EstadoVacio>
        )
      }
      return (
        <EstadoVacio mensaje="Todavía no hiciste ningún pedido.">
          <Link to="/" className="font-semibold text-red-700 hover:underline">
            Ver el catálogo
          </Link>
        </EstadoVacio>
      )
    }
    return (
      <>
        {/* Mientras se actualiza (otra página, o lo que estaba en caché), la lista queda
            atenuada y «Cancelar», deshabilitado: puede estar viejo (H106) */}
        <ul
          aria-busy={pedidos.isFetching || undefined}
          className={`space-y-3 transition-opacity ${pedidos.isFetching ? 'opacity-60' : ''}`}
        >
          {items.map((pedido) => {
            const estaAbierto = abierto === pedido.id
            const detalleId = `detalle-pedido-${pedido.id}`
            return (
              <li key={pedido.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="font-semibold text-stone-900">Pedido #{pedido.id}</h2>
                    <BadgeEstado estado={pedido.estado} />
                    <span className="text-sm text-stone-500">{formatearFecha(pedido.created_at)}</span>
                    <span className="ml-auto font-semibold text-stone-900">
                      {formatearPrecio(pedido.total)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* aria-label con el número: hay un botón así por pedido */}
                    <Button
                      variante="secundario"
                      aria-expanded={estaAbierto}
                      aria-controls={detalleId}
                      aria-label={`${estaAbierto ? 'Ocultar' : 'Ver'} detalle del pedido ${pedido.id}`}
                      onClick={() => setAbierto(estaAbierto ? null : pedido.id)}
                    >
                      {estaAbierto ? 'Ocultar detalle' : 'Ver detalle'}
                    </Button>
                    {/* RN-04: el cliente cancela solo en PENDIENTE. Si el admin ya lo avanzó,
                        el backend responde 400 y la lista se pone al día sola */}
                    {pedido.estado === 'PENDIENTE' && (
                      <Button
                        variante="peligro"
                        aria-label={`Cancelar el pedido ${pedido.id}`}
                        disabled={pedidos.isFetching}
                        onClick={() => setACancelar(pedido)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                  <div id={detalleId} hidden={!estaAbierto} className="mt-4 border-t border-stone-200 pt-4">
                    <PedidoDetalle pedido={pedido} />
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
        <Paginacion
          pagina={pagina}
          totalPaginas={Math.ceil(total / POR_PAGINA)}
          onCambiar={cambiarPagina}
        />
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Mis pedidos</h1>

      {/* role="status": se anuncia sin interrumpir */}
      {creado !== undefined && !cancelar.isSuccess && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          Listo, tu pedido #{creado} quedó confirmado.
        </p>
      )}
      {cancelar.isSuccess && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          Cancelaste el pedido #{cancelar.data.id}.
        </p>
      )}
      {cancelar.isError && (
        <div className="mb-4">
          <EstadoError mensaje={handleApiError(cancelar.error, 'No se pudo cancelar el pedido')} />
        </div>
      )}

      {contenido()}

      <Modal
        abierto={aCancelar !== null}
        titulo={`¿Cancelar el pedido #${aCancelar?.id ?? ''}?`}
        onCerrar={() => setACancelar(null)}
      >
        <p className="mb-6 text-stone-600">
          {aCancelar && `Es un pedido de ${formatearPrecio(aCancelar.total)}. `}
          Una vez cancelado no se puede volver a activar.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setACancelar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={cancelar.isPending} onClick={confirmarCancelacion}>
            Cancelar pedido
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MisPedidosPage
