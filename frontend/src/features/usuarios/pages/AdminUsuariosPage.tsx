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
import { NOMBRE_ROL, type Usuario } from '@/features/auth'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Skeleton from '@/shared/components/Skeleton'
import Tabla from '@/shared/components/Tabla'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import { useAuthStore } from '@/store/authStore'
import { useCambiarEstadoUsuario } from '../hooks/useCambiarEstadoUsuario'
import { useUsuarios } from '../hooks/useUsuarios'

const SIN_USUARIOS: Usuario[] = []
const columna = createColumnHelper<Usuario>()
const porTexto = (a: string, b: string) => a.localeCompare(b, 'es')

function AdminUsuariosPage() {
  const usuarios = useUsuarios()
  const cambiar = useCambiarEstadoUsuario()
  // La sesión guarda el username (no el id): alcanza para reconocer la fila propia, porque
  // el backend lo guarda único y en minúsculas
  const miUsuario = useAuthStore((s) => s.usuario?.username)

  const [aDesactivar, setADesactivar] = useState<Usuario | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'username', desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const { mutate, isPending } = cambiar
  const columnas = useMemo(
    () => [
      columna.accessor('username', {
        header: 'Usuario',
        sortingFn: (a, b) => porTexto(a.original.username, b.original.username),
        cell: ({ row }) => (
          <span className="font-medium text-stone-900">
            {row.original.username}
            {row.original.username === miUsuario && <span className="text-xs text-stone-500"> (vos)</span>}
          </span>
        ),
      }),
      columna.accessor('full_name', {
        header: 'Nombre',
        sortingFn: (a, b) => porTexto(a.original.full_name, b.original.full_name),
      }),
      columna.accessor('email', { header: 'Email', enableSorting: false }),
      columna.accessor('role', {
        header: 'Rol',
        enableSorting: false,
        cell: (info) => NOMBRE_ROL[info.getValue()],
      }),
      columna.accessor('disabled', {
        header: 'Estado',
        enableSorting: false,
        cell: (info) =>
          info.getValue() ? <span className="font-semibold text-red-700">Desactivado</span> : 'Activo',
      }),
      columna.display({
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const u = row.original
          // La consigna: el botón Desactivar no se muestra en la fila de la sesión. Si igual
          // llegara el pedido, el backend responde 400 (H37)
          if (u.username === miUsuario) return null
          return (
            <div className="flex justify-end">
              {u.disabled ? (
                <Button
                  variante="secundario"
                  aria-label={`Activar a ${u.username}`}
                  disabled={isPending}
                  onClick={() =>
                    mutate({ id: u.id, activo: true }, { onSuccess: () => setAviso(`Activaste a ${u.username}.`) })
                  }
                >
                  Activar
                </Button>
              ) : (
                <Button variante="peligro" aria-label={`Desactivar a ${u.username}`} onClick={() => setADesactivar(u)}>
                  Desactivar
                </Button>
              )}
            </div>
          )
        },
      }),
    ],
    [miUsuario, mutate, isPending],
  )

  const tabla = useReactTable({
    data: usuarios.data ?? SIN_USUARIOS,
    columns: columnas,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (u) => String(u.id),
    autoResetPageIndex: false, // H97
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalPaginas = tabla.getPageCount()
  if (pagination.pageIndex > 0 && pagination.pageIndex >= totalPaginas) {
    setPagination({ ...pagination, pageIndex: Math.max(totalPaginas - 1, 0) })
  }

  function confirmarDesactivar() {
    if (!aDesactivar) return
    const { id, username } = aDesactivar
    mutate(
      { id, activo: false },
      { onSuccess: () => setAviso(`Desactivaste a ${username}.`), onSettled: () => setADesactivar(null) },
    )
  }

  function contenido() {
    if (usuarios.isPending) return <Skeleton cantidad={4} alto="h-12" />
    if (usuarios.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(usuarios.error, 'No se pudieron cargar los usuarios')}
          onReintentar={() => usuarios.refetch()}
        />
      )
    }
    if (usuarios.data.length === 0) return <EstadoVacio mensaje="Todavía no hay usuarios." />
    return <Tabla tabla={tabla} titulo="Usuarios" />
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Usuarios</h1>

      {aviso && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          {aviso}
        </p>
      )}
      {cambiar.isError && (
        <div className="mb-4">
          <EstadoError mensaje={handleApiError(cambiar.error, 'No se pudo cambiar el estado de la cuenta')} />
        </div>
      )}

      {contenido()}

      <Modal
        abierto={aDesactivar !== null}
        titulo={`¿Desactivar a ${aDesactivar?.username ?? ''}?`}
        onCerrar={() => setADesactivar(null)}
      >
        {/* Lo que pasa de verdad: su sesión se corta en el próximo pedido (H21) */}
        <p className="mb-6 text-stone-600">
          No va a poder iniciar sesión, y si tiene una abierta, se cierra en su próxima acción. Sus
          pedidos no cambian. Lo podés volver a activar cuando quieras.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setADesactivar(null)}>
            Volver
          </Button>
          <Button variante="peligro" cargando={isPending} onClick={confirmarDesactivar}>
            Desactivar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminUsuariosPage
