import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listarProductos } from '../api/productos'
import type { FiltrosProductos } from '../types/producto'

// Los filtros van en la queryKey: cada combinación tiene su propia entrada en la caché, y al
// cambiar un filtro TanStack Query pide la página nueva sola
export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => listarProductos(filtros),
    // Mientras llega la página nueva sigue mostrando la anterior (isPlaceholderData), en vez
    // de volver al skeleton en cada cambio
    placeholderData: keepPreviousData,
  })
}
