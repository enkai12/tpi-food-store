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
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Skeleton from '@/shared/components/Skeleton'
import Tabla from '@/shared/components/Tabla'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import CategoriaForm from '../components/CategoriaForm'
import { useCategorias } from '../hooks/useCategorias'
import { useCrearCategoria } from '../hooks/useCrearCategoria'
import { useEditarCategoria } from '../hooks/useEditarCategoria'
import { useEliminarCategoria } from '../hooks/useEliminarCategoria'
import type { Categoria, CategoriaDatos } from '../types/categoria'

// Afuera del componente: una referencia fija mientras carga. Un [] nuevo en cada render haría
// que la tabla se reinicie todo el tiempo (U08 A03)
const SIN_CATEGORIAS: Categoria[] = []
const columna = createColumnHelper<Categoria>()

function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const editar = useEditarCategoria()
  const eliminar = useEliminarCategoria()

  // El formulario: cerrado (null), una nueva ({ categoria: null }) o una que se edita
  const [formulario, setFormulario] = useState<{ categoria: Categoria | null } | null>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // useMemo: las columnas también necesitan una referencia fija. Los set de useState no
  // cambian nunca, por eso no hay dependencias
  const columnas = useMemo(
    () => [
      columna.accessor('nombre', {
        header: 'Nombre',
        // Orden alfabético en castellano: con < una «Ñ» o una tilde inicial quedan después de la «Z»
        sortingFn: (a, b) => a.original.nombre.localeCompare(b.original.nombre, 'es'),
        cell: (info) => <span className="font-medium text-stone-900">{info.getValue()}</span>,
      }),
      columna.accessor('descripcion', {
        header: 'Descripción',
        enableSorting: false,
        cell: (info) => <span className="wrap-anywhere text-stone-600">{info.getValue() ?? '—'}</span>,
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        // row.original es la categoría entera de esa fila
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variante="secundario"
              aria-label={`Editar ${row.original.nombre}`}
              onClick={() => setFormulario({ categoria: row.original })}
            >
              Editar
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
    data: categorias.data ?? SIN_CATEGORIAS,
    columns: columnas,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (categoria) => String(categoria.id),
    // Por defecto, cada vez que cambian los datos vuelve a la primera página: después de
    // editar una fila de la página 2, la lista llega de nuevo y salta a la 1 (H97)
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Si se dio de baja la única fila de la última página, esa página ya no existe: paso a la
  // anterior. Se ajusta durante el render, sin un efecto
  const totalPaginas = tabla.getPageCount()
  if (pagination.pageIndex > 0 && pagination.pageIndex >= totalPaginas) {
    setPagination({ ...pagination, pageIndex: Math.max(totalPaginas - 1, 0) })
  }

  // Al cerrar, por cualquier camino, se limpia el error del último intento: así no aparece
  // de nuevo la próxima vez que se abre el formulario
  function cerrarFormulario() {
    setFormulario(null)
    crear.reset()
    editar.reset()
  }

  function guardar(datos: CategoriaDatos) {
    const editando = formulario?.categoria
    const listo = (mensaje: string) => {
      cerrarFormulario()
      setAviso(mensaje)
    }
    if (editando) {
      editar.mutate({ id: editando.id, datos }, { onSuccess: (c) => listo(`Guardaste los cambios de «${c.nombre}».`) })
    } else {
      crear.mutate(datos, { onSuccess: (c) => listo(`Creaste la categoría «${c.nombre}».`) })
    }
  }

  function confirmarBaja() {
    if (!aEliminar) return
    const { id, nombre } = aEliminar
    eliminar.mutate(id, {
      onSuccess: () => setAviso(`Diste de baja «${nombre}».`),
      onSettled: () => setAEliminar(null),
    })
  }

  const mutacionFormulario = formulario?.categoria ? editar : crear

  function contenido() {
    if (categorias.isPending) return <Skeleton cantidad={5} alto="h-12" />
    if (categorias.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(categorias.error, 'No se pudieron cargar las categorías')}
          onReintentar={() => categorias.refetch()}
        />
      )
    }
    if (categorias.data.length === 0) return <EstadoVacio mensaje="Todavía no hay categorías." />
    return <Tabla tabla={tabla} titulo="Categorías activas" />
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
        <Button onClick={() => setFormulario({ categoria: null })}>Nueva categoría</Button>
      </div>

      {aviso && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          {aviso}
        </p>
      )}
      {eliminar.isError && (
        <div className="mb-4">
          <EstadoError mensaje={handleApiError(eliminar.error, 'No se pudo dar de baja la categoría')} />
        </div>
      )}

      {contenido()}

      <Modal
        abierto={formulario !== null}
        titulo={formulario?.categoria ? `Editar «${formulario.categoria.nombre}»` : 'Nueva categoría'}
        onCerrar={cerrarFormulario}
      >
        {formulario && (
          <CategoriaForm
            // Otra key, otro formulario: arranca de cero con los datos de la elegida
            key={formulario.categoria?.id ?? 'nueva'}
            categoria={formulario.categoria}
            onConfirmar={guardar}
            onCancelar={cerrarFormulario}
            enviando={mutacionFormulario.isPending}
            error={
              mutacionFormulario.isError
                ? handleApiError(mutacionFormulario.error, 'No se pudo guardar la categoría')
                : undefined
            }
          />
        )}
      </Modal>

      <Modal
        abierto={aEliminar !== null}
        titulo={`¿Dar de baja «${aEliminar?.nombre ?? ''}»?`}
        onCerrar={() => setAEliminar(null)}
      >
        {/* Lo que pasa de verdad con una baja lógica (H9): conviene que el admin lo sepa */}
        <p className="mb-6 text-stone-600">
          Deja de aparecer en el filtro del catálogo. Sus productos siguen a la venta hasta que los
          des de baja, y el nombre no se puede volver a usar.
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

export default AdminCategoriasPage
