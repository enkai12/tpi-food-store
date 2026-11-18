import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelarPedido } from '../api/pedidos'

export function useCancelarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelarPedido,
    // Solo si se canceló vuelve el stock (RN-03)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    // Los pedidos, también con error: un 400 muestra que ya no estaba en PENDIENTE (lo avanzó
    // el admin), y la lista se pone al día y saca el botón
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}
