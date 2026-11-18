import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearPedido } from '../api/pedidos'

export function useCrearPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearPedido,
    // Un pedido nuevo cambia la lista de pedidos
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
    // Los productos, también con error: un 400 de stock o un 404 de un producto dado de baja
    // muestran que lo que tenía el carrito estaba viejo. ['productos'] alcanza al catálogo
    // (['productos', filtros]) y al carrito (['productos', id])
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
