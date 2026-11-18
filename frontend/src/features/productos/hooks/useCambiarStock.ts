import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cambiarStock } from '../api/productos'
import type { StockDatos } from '../types/producto'

export function useCambiarStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: StockDatos }) => cambiarStock(id, datos),
    // También con error: un 404 es que otro lo dio de baja (o la categoría elegida ya no
    // está), y la tabla, el catálogo y los carritos tienen que verlo (H91)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
