import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eliminarCategoria } from '../api/categorias'

export function useEliminarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: eliminarCategoria,
    // Sus productos siguen a la venta, pero con la categoría dada de baja anidada
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    // También con error: un 404 es que ya estaba dada de baja
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
