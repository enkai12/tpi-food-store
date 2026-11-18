import { flexRender, type Table } from '@tanstack/react-table'
import Paginacion from './Paginacion'

interface TablaProps<T> {
  tabla: Table<T> // la instancia de useReactTable: cada página arma la suya con sus columnas
  titulo: string // el <caption>: lo lee un lector de pantalla, no se ve
}

// Dibuja cualquier tabla del panel: encabezados (los que se pueden ordenar son botones),
// filas y la paginación del lado del cliente. TanStack Table es headless: calcula qué filas
// van y en qué orden, y el HTML lo pone este componente
function Tabla<T>({ tabla, titulo }: TablaProps<T>) {
  const { pageIndex } = tabla.getState().pagination
  return (
    <>
      {/* overflow-x-auto: en el celular la tabla se desliza sin romper la página. relative: el
          texto oculto (sr-only) es absolute y, sin un ancestro posicionado, se escapaba de la
          caja y estiraba la página (H105) */}
      <div className="relative overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{titulo}</caption>
          <thead className="bg-stone-50 text-xs text-stone-600">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((header) => {
                  const orden = header.column.getIsSorted()
                  const contenido = flexRender(header.column.columnDef.header, header.getContext())
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      // aria-sort solo en la columna ordenada: «ascending» o «descending»
                      aria-sort={orden === 'asc' ? 'ascending' : orden === 'desc' ? 'descending' : undefined}
                      className="px-4 py-3 font-semibold whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-stone-900"
                        >
                          {contenido}
                          <span aria-hidden="true">{orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : (
                        contenido
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {tabla.getRowModel().rows.map((fila) => (
              <tr key={fila.id} className="border-t border-stone-100">
                {fila.getVisibleCells().map((celda) => (
                  <td key={celda.id} className="px-4 py-3 align-top">
                    {flexRender(celda.column.columnDef.cell, celda.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* La misma Paginacion del catálogo; acá la página la lleva TanStack Table (empieza en 0) */}
      <Paginacion
        pagina={pageIndex + 1}
        totalPaginas={tabla.getPageCount()}
        onCambiar={(pagina) => tabla.setPageIndex(pagina - 1)}
      />
    </>
  )
}

export default Tabla
