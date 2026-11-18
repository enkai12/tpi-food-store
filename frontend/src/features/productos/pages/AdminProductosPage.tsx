import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useCategorias, type Categoria } from '@/features/categorias'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Skeleton from '@/shared/components/Skeleton'
import Tabla from '@/shared/components/Tabla'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import { formatearPrecio } from '@/shared/utils/formato'
import ProductoForm from '../components/ProductoForm'
import StockForm from '../components/StockForm'
import { useCambiarStock } from '../hooks/useCambiarStock'
import { useCrearProducto } from '../hooks/useCrearProducto'
import { useEditarProducto } from '../hooks/useEditarProducto'
import { useEliminarProducto } from '../hooks/useEliminarProducto'
import { useProductos } from '../hooks/useProductos'
import type { Producto, ProductoDatos, StockDatos } from '../types/producto'

// El panel pide hasta 100 productos y pagina en el navegador, como dice la consigna. 100 es
// también el máximo que acepta el backend (H101)
const LIMITE = 100
const SIN_PRODUCTOS: Producto[] = []
const SIN_CATEGORIAS: Categoria[] = []
const columna = createColumnHelper<Producto>()
const porTexto = (a: string, b: string) => a.localeCompare(b, 'es')

function AdminProductosPage() {
  const productos = useProductos({ skip: 0, limit: LIMITE })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const editar = useEditarProducto()
  const cambiarStock = useCambiarStock()
  const eliminar = useEliminarProducto()

  // Qué Modal está abierto: ninguno, el formulario (nuevo o para editar) o el de stock
  const [formulario, setFormulario] = useState<{ producto: Producto | null } | null>(null)
  const [enStock, setEnStock] = useState<Producto | null>(null)
  const [aEliminar, setAEliminar] = useState<Producto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const columnas = useMemo(
    () => [
      columna.accessor('nombre', {
        header: 'Nombre',
        sortingFn: (a, b) => porTexto(a.original.nombre, b.original.nombre),
        cell: (info) => <span className="font-medium text-stone-900">{info.getValue()}</span>,
      }),
      columna.accessor((p) => p.categoria.nombre, {
        id: 'categoria',
        header: 'Categoría',
        sortingFn: (a, b) => porTexto(a.original.categoria.nombre, b.original.categoria.nombre),
        cell: ({ row }) => (
          <span className="text-stone-600">
            {row.original.categoria.nombre}
            {!row.original.categoria.activo && <span className="text-xs text-red-700"> (dada de baja)</span>}
          </span>
        ),
      }),
      columna.accessor('precio_base', {
        header: 'Precio',
        cell: (info) => <span className="whitespace-nowrap">{formatearPrecio(info.getValue())}</span>,
      }),
      columna.accessor('stock', {
        header: 'Stock',
        cell: (info) => (
          <span className={info.getValue() === 0 ? 'font-semibold text-red-700' : ''}>{info.getValue()}</span>
        ),
      }),
      columna.accessor('disponible', {
        header: 'Disponible',
        enableSorting: false,
        cell: (info) => (info.getValue() ? 'Sí' : <span className="font-semibold text-red-700">No</span>),
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variante="secundario"
              aria-label={`Editar ${row.original.nombre}`}
              onClick={() => setFormulario({ producto: row.original })}
            >
              Editar
            </Button>
            <Button
              variante="secundario"
              aria-label={`Stock de ${row.original.nombre}`}
              onClick={() => setEnStock(row.original)}
            >
              Stock
            </Button>
            <Button
              variante="peligro"
              aria-label={`Dar de baja ${row.original.nombre}`}
              onClick={() => setAEliminar(row.original)}
            >
              Dar de baja
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const tabla = useReactTable({
    data: productos.data?.items ?? SIN_PRODUCTOS,
    columns: columnas,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (producto) => String(producto.id),
    autoResetPageIndex: false, // como en categorías (H97)
    // Por defecto, las columnas numéricas (precio, stock) arrancan de mayor a menor: así todas
    // empiezan de menor a mayor, como el nombre (H104)
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalPaginas = tabla.getPageCount()
  if (pagination.pageIndex > 0 && pagination.pageIndex >= totalPaginas) {
    setPagination({ ...pagination, pageIndex: Math.max(totalPaginas - 1, 0) })
  }

  function cerrarFormulario() {
    setFormulario(null)
    crear.reset()
    editar.reset()
  }

  function cerrarStock() {
    setEnStock(null)
    cambiarStock.reset()
  }

  function guardar(datos: ProductoDatos) {
    const editando = formulario?.producto
    const listo = (mensaje: string) => {
      cerrarFormulario()
      setAviso(mensaje)
    }
    if (editando) {
      // El PUT va sin stock ni disponible: esos los cambia «Stock» (H103)
      const { stock: _stock, disponible: _disponible, ...edicion } = datos
      editar.mutate({ id: editando.id, datos: edicion }, { onSuccess: (p) => listo(`Guardaste los cambios de «${p.nombre}».`) })
    } else {
      crear.mutate(datos, { onSuccess: (p) => listo(`Creaste el producto «${p.nombre}».`) })
    }
  }

  function guardarStock(datos: StockDatos) {
    if (!enStock) return
    cambiarStock.mutate(
      { id: enStock.id, datos },
      {
        onSuccess: (p) => {
          cerrarStock()
          setAviso(`«${p.nombre}»: stock ${p.stock}, ${p.disponible ? 'disponible' : 'no disponible'}.`)
        },
      },
    )
  }

  function confirmarBaja() {
    if (!aEliminar) return
    const { id, nombre } = aEliminar
    eliminar.mutate(id, {
      onSuccess: () => setAviso(`Diste de baja «${nombre}».`),
      onSettled: () => setAEliminar(null),
    })
  }

  const mutacionFormulario = formulario?.producto ? editar : crear

  function contenido() {
    if (productos.isPending) return <Skeleton cantidad={6} alto="h-12" />
    if (productos.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(productos.error, 'No se pudieron cargar los productos')}
          onReintentar={() => productos.refetch()}
        />
      )
    }
    const { total, items } = productos.data
    if (items.length === 0) return <EstadoVacio mensaje="Todavía no hay productos." />
    return (
      <>
        {total > items.length && (
          <p role="status" className="mb-3 text-sm text-amber-800">
            Se muestran los primeros {items.length} de {total} productos.
          </p>
        )}
        <Tabla tabla={tabla} titulo="Productos activos" />
      </>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
        <Button onClick={() => setFormulario({ producto: null })}>Nuevo producto</Button>
      </div>

      {aviso && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          {aviso}
        </p>
      )}
      {eliminar.isError && (
        <div className="mb-4">
          <EstadoError mensaje={handleApiError(eliminar.error, 'No se pudo dar de baja el producto')} />
        </div>
      )}

      {contenido()}

      <Modal
        abierto={formulario !== null}
        titulo={formulario?.producto ? `Editar «${formulario.producto.nombre}»` : 'Nuevo producto'}
        onCerrar={cerrarFormulario}
      >
        {formulario && (
          <ProductoForm
            key={formulario.producto?.id ?? 'nuevo'}
            producto={formulario.producto}
            categorias={categorias.data ?? SIN_CATEGORIAS}
            onConfirmar={guardar}
            onCancelar={cerrarFormulario}
            enviando={mutacionFormulario.isPending}
            error={
              mutacionFormulario.isError
                ? handleApiError(mutacionFormulario.error, 'No se pudo guardar el producto')
                : undefined
            }
          />
        )}
      </Modal>

      <Modal
        abierto={enStock !== null}
        titulo={`Stock de «${enStock?.nombre ?? ''}»`}
        onCerrar={cerrarStock}
      >
        {enStock && (
          <StockForm
            key={enStock.id}
            producto={enStock}
            onConfirmar={guardarStock}
            onCancelar={cerrarStock}
            enviando={cambiarStock.isPending}
            error={
              cambiarStock.isError ? handleApiError(cambiarStock.error, 'No se pudo cambiar el stock') : undefined
            }
          />
        )}
      </Modal>

      <Modal
        abierto={aEliminar !== null}
        titulo={`¿Dar de baja «${aEliminar?.nombre ?? ''}»?`}
        onCerrar={() => setAEliminar(null)}
      >
        <p className="mb-6 text-stone-600">
          Deja de aparecer en el catálogo y no se puede pedir. Los pedidos que ya lo tienen no
          cambian: guardan su nombre y su precio.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setAEliminar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={eliminar.isPending} onClick={confirmarBaja}>
            Dar de baja
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminProductosPage
