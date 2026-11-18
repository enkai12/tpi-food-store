import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cambiarEstadoPedido } from '../api/pedidos'
import type { EstadoPedido } from '../types/pedido'

export function useCambiarEstadoPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, estado),
    // Cancelar restituye el stock (RN-03): el catálogo y los carritos tienen que verlo
    onSuccess: (_pedido, { estado }) => {
      if (estado === 'CANCELADO') queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    // También con error: un 400 es que el pedido ya cambió (H91). ['pedidos'] alcanza a la
    // tabla, a «Mis pedidos» y al resumen (['pedidos', 'resumen'])
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}
