import { useMutation, useQueryClient } from '@tanstack/react-query'
import { editarProducto } from '../api/productos'
import type { ProductoEdicion } from '../types/producto'

export function useEditarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoEdicion }) => editarProducto(id, datos),
    // También con error: un 404 puede ser el producto (otro lo dio de baja) o la categoría
    // elegida (ya no está): la tabla, el catálogo, los carritos y el Select se ponen al día
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
