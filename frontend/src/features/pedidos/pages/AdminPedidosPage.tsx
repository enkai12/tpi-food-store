import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUsuarios } from '@/features/usuarios'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Skeleton from '@/shared/components/Skeleton'
import BadgeEstado from '@/shared/ui/BadgeEstado'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import Select from '@/shared/ui/Select'
import { formatearPrecio } from '@/shared/utils/formato'
import { leerEntero } from '@/shared/utils/url'
import PedidoDetalle from '../components/PedidoDetalle'
import TablaPedidos from '../components/TablaPedidos'
import { useCambiarEstadoPedido } from '../hooks/useCambiarEstadoPedido'
import { usePedidos } from '../hooks/usePedidos'
import type { EstadoPedido, Pedido } from '../types/pedido'

const POR_PAGINA = 10

// Las opciones del filtro, en plural: «Pendientes», no «Pendiente» como el badge
const FILTROS: { valor: EstadoPedido; texto: string }[] = [
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'EN_PREPARACION', texto: 'En preparación' },
  { valor: 'ENTREGADO', texto: 'Entregados' },
  { valor: 'CANCELADO', texto: 'Cancelados' },
]

// El estado de la URL, si es uno de los cuatro (?estado=ENVIADO se ignora)
const leerEstado = (valor: string | null) => FILTROS.find((f) => f.valor === valor)?.valor

const TEXTO_HECHO: Record<EstadoPedido, string> = {
  PENDIENTE: 'quedó pendiente',
  EN_PREPARACION: 'pasó a preparación',
  ENTREGADO: 'quedó entregado',
  CANCELADO: 'quedó cancelado y su stock volvió al catálogo',
}

function AdminPedidosPage() {
  // La página y el filtro viven en la URL (?estado=PENDIENTE&pagina=2), como en el catálogo
  const [params, setParams] = useSearchParams()
  const pagina = leerEntero(params.get('pagina')) ?? 1
  const estado = leerEstado(params.get('estado'))

  // Sin propios: el admin ve los pedidos de todos (RN-04)
  const pedidos = usePedidos({ skip: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA, estado })
  const usuarios = useUsuarios()
  const cambiar = useCambiarEstadoPedido()

  const [viendo, setViendo] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // useCallback: la tabla arma sus columnas con estas funciones (useMemo), y así no cambian en
  // cada render. Los datos de usuarios sí cambian cuando llegan: ahí se rearman, como debe ser
  const nombreCliente = useCallback(
    (id: number) => {
      const u = usuarios.data?.find((x) => x.id === id)
      return u ? `${u.full_name} (${u.username})` : `Usuario #${id}`
    },
    [usuarios.data],
  )

  const { mutate: mutarEstado } = cambiar
  const aplicar = useCallback(
    (pedido: Pedido, destino: EstadoPedido) => {
      mutarEstado(
        { id: pedido.id, estado: destino },
        {
          onSuccess: (p) => setAviso(`El pedido #${p.id} ${TEXTO_HECHO[p.estado]}.`),
          onSettled: () => setACancelar(null),
        },
      )
    },
    [mutarEstado],
  )

  // Cancelar devuelve stock y no se deshace: pide confirmación. Avanzar es el trabajo de todos
  // los días y va directo
  const onCambiarEstado = useCallback(
    (pedido: Pedido, destino: EstadoPedido) => {
      setAviso(null)
      if (destino === 'CANCELADO') setACancelar(pedido)
      else aplicar(pedido, destino)
    },
    [aplicar],
  )

  function cambiarFiltros(cambios: { pagina?: number; estado?: EstadoPedido }) {
    const nuevos = new URLSearchParams()
    const e = 'estado' in cambios ? cambios.estado : estado
    if (e) nuevos.set('estado', e)
    if (cambios.pagina && cambios.pagina > 1) nuevos.set('pagina', String(cambios.pagina))
    setParams(nuevos)
  }

  function contenido() {
    if (pedidos.isPending) return <Skeleton cantidad={5} alto="h-14" />
    if (pedidos.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(pedidos.error, 'No se pudieron cargar los pedidos')}
          onReintentar={() => pedidos.refetch()}
        />
      )
    }
    const { total, items } = pedidos.data
    if (items.length === 0) {
      if (total > 0) {
        return (
          <EstadoVacio mensaje="Esta página no existe.">
            <Button variante="secundario" onClick={() => cambiarFiltros({ pagina: 1 })}>
              Ir a la primera página
            </Button>
          </EstadoVacio>
        )
      }
      if (estado) {
        return (
          <EstadoVacio mensaje="No hay pedidos en ese estado.">
            <Button variante="secundario" onClick={() => cambiarFiltros({ estado: undefined })}>
              Ver todos
            </Button>
          </EstadoVacio>
        )
      }
      return <EstadoVacio mensaje="Todavía no hay pedidos." />
    }
    // Mientras se actualiza (otra página, o después de un cambio), lo que se ve puede estar
    // viejo: se atenúa y los botones se deshabilitan, así no se actúa sobre un estado que ya
    // no es el real (H106)
    const actualizando = pedidos.isFetching
    return (
      <div aria-busy={actualizando || undefined} className={`transition-opacity ${actualizando ? 'opacity-60' : ''}`}>
        <p className="mb-3 text-sm text-stone-600" aria-live="polite">
          {total === 1 ? '1 pedido' : `${total} pedidos`}
        </p>
        <TablaPedidos
          pedidos={items}
          total={total}
          pagina={pagina}
          porPagina={POR_PAGINA}
          onCambiarPagina={(p) => cambiarFiltros({ pagina: p })}
          nombreCliente={nombreCliente}
          onVer={setViendo}
          onCambiarEstado={onCambiarEstado}
          ocupado={cambiar.isPending || actualizando}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
        <Select
          label="Estado"
          className="w-48"
          value={estado ?? ''}
          // Al cambiar el filtro, vuelve a la primera página
          onChange={(e) => cambiarFiltros({ estado: leerEstado(e.target.value) })}
        >
          <option value="">Todos</option>
          {FILTROS.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.texto}
            </option>
          ))}
        </Select>
      </div>

      {aviso && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          {aviso}
        </p>
      )}
      {/* Por ejemplo, el 400 si otro admin ya lo había entregado: la tabla se pone al día sola */}
      {cambiar.isError && (
        <div className="mb-4">
          <EstadoError mensaje={handleApiError(cambiar.error, 'No se pudo cambiar el estado')} />
        </div>
      )}

      {contenido()}

      <Modal abierto={viendo !== null} titulo={`Pedido #${viendo?.id ?? ''}`} onCerrar={() => setViendo(null)}>
        {viendo && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-700">
              <BadgeEstado estado={viendo.estado} />
              <span>{nombreCliente(viendo.usuario_id)}</span>
            </div>
            <PedidoDetalle pedido={viendo} />
            <div className="flex justify-end">
              <Button variante="secundario" onClick={() => setViendo(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        abierto={aCancelar !== null}
        titulo={`¿Cancelar el pedido #${aCancelar?.id ?? ''}?`}
        onCerrar={() => setACancelar(null)}
      >
        <p className="mb-6 text-stone-600">
          {aCancelar && `Es un pedido de ${formatearPrecio(aCancelar.total)}. `}
          Su stock vuelve al catálogo y no se puede volver a activar.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setACancelar(null)}>
            Volver
          </Button>
          <Button
            variante="peligro"
            cargando={cambiar.isPending}
            onClick={() => aCancelar && aplicar(aCancelar, 'CANCELADO')}
          >
            Cancelar pedido
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPedidosPage
