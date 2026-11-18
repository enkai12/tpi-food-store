import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type Updater,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import Tabla from '@/shared/components/Tabla'
import BadgeEstado from '@/shared/ui/BadgeEstado'
import Button from '@/shared/ui/Button'
import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { ACCION_HACIA, TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido'

interface TablaPedidosProps {
  pedidos: Pedido[] // la página actual, que ya viene paginada y filtrada del backend
  total: number
  pagina: number // empieza en 1
  porPagina: number
  onCambiarPagina: (pagina: number) => void
  nombreCliente: (usuarioId: number) => string
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
  ocupado: boolean // mientras se cambia un estado: un doble clic no manda dos pedidos
}

const columna = createColumnHelper<Pedido>()

// La tabla del panel de pedidos. A diferencia de categorías y productos, pagina el backend:
// los pedidos crecen sin tope. TanStack Table solo dibuja la página que llega
// (manualPagination) y calcula cuántas hay con rowCount
function TablaPedidos(props: TablaPedidosProps) {
  const { pedidos, total, pagina, porPagina, onCambiarPagina, nombreCliente, onVer, onCambiarEstado, ocupado } = props

  // Las funciones que reciben las celdas van en las dependencias: la página se las pasa con
  // useCallback, así las columnas no se rearman en cada render
  const columnas = useMemo(
    () => [
      columna.accessor('id', {
        header: 'Pedido',
        cell: (info) => <span className="font-medium text-stone-900">#{info.getValue()}</span>,
      }),
      columna.accessor('usuario_id', {
        header: 'Cliente',
        cell: (info) => nombreCliente(info.getValue()),
      }),
      columna.accessor('created_at', {
        header: 'Fecha',
        cell: (info) => <span className="whitespace-nowrap">{formatearFecha(info.getValue())}</span>,
      }),
      columna.accessor('total', {
        header: 'Total',
        cell: (info) => <span className="whitespace-nowrap">{formatearPrecio(info.getValue())}</span>,
      }),
      columna.accessor('estado', {
        header: 'Estado',
        cell: (info) => <BadgeEstado estado={info.getValue()} />,
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        // Los botones salen de la máquina de estados: ENTREGADO y CANCELADO no tienen ninguno
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variante="secundario"
              aria-label={`Ver el pedido ${row.original.id}`}
              onClick={() => onVer(row.original)}
            >
              Ver
            </Button>
            {TRANSICIONES[row.original.estado].map((destino) => (
              <Button
                key={destino}
                variante={destino === 'CANCELADO' ? 'peligro' : 'primario'}
                aria-label={`${ACCION_HACIA[destino]} el pedido ${row.original.id}`}
                className="whitespace-nowrap"
                disabled={ocupado}
                onClick={() => onCambiarEstado(row.original, destino)}
              >
                {ACCION_HACIA[destino]}
              </Button>
            ))}
          </div>
        ),
      }),
    ],
    [nombreCliente, onVer, onCambiarEstado, ocupado],
  )

  const paginacion: PaginationState = { pageIndex: pagina - 1, pageSize: porPagina }

  const tabla = useReactTable({
    data: pedidos,
    columns: columnas,
    state: { pagination: paginacion },
    // La página vive en la URL: cuando la tabla pide otra, se la paso a la pantalla
    onPaginationChange: (cambio: Updater<PaginationState>) => {
      const nueva = typeof cambio === 'function' ? cambio(paginacion) : cambio
      onCambiarPagina(nueva.pageIndex + 1)
    },
    manualPagination: true,
    rowCount: total,
    // El orden lo pone el backend (del más nuevo al más viejo): ordenar en el navegador solo
    // ordenaría la página que se ve
    enableSorting: false,
    getRowId: (pedido) => String(pedido.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return <Tabla tabla={tabla} titulo="Pedidos" />
}

export default TablaPedidos
