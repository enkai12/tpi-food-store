import { useMutation, useQueryClient } from '@tanstack/react-query'
import { editarCategoria } from '../api/categorias'
import type { CategoriaDatos } from '../types/categoria'

export function useEditarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaDatos }) => editarCategoria(id, datos),
    // Cada producto trae su categoría anidada: si cambió el nombre, los productos en caché
    // muestran el viejo
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    // También con error: un 404 es que otro la dio de baja, y la tabla tiene que sacarla
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
