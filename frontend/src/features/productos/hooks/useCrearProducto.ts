import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearProducto } from '../api/productos'

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearProducto,
    // También con error: un 404 es que la categoría elegida ya no está, y el Select de
    // categorías se pone al día. El producto nuevo aparece en la tabla y en el catálogo
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
