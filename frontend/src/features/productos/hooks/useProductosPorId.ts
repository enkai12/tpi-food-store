import { useQueries } from '@tanstack/react-query'
import { obtenerProducto } from '../api/productos'

// Una query por producto, en paralelo (el backend no tiene un pedido por varios ids). Si un
// producto ya está en la caché y fresco, no se vuelve a pedir
export function useProductosPorId(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['productos', id],
      queryFn: () => obtenerProducto(id),
    })),
  })
}
