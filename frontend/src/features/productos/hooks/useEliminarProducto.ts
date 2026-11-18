import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eliminarProducto } from '../api/productos'

export function useEliminarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarProducto,
    // También con error: un 404 es que otro lo dio de baja (o la categoría elegida ya no
    // está), y la tabla, el catálogo y los carritos tienen que verlo (H91)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
