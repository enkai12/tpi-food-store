import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearCategoria } from '../api/categorias'

export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearCategoria,
    // También con error: un 409 puede ser una categoría que otro creó recién (H91). La misma
    // clave la usa el filtro del catálogo, que también se pone al día
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
