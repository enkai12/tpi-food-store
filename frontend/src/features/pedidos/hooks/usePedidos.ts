import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listarPedidos } from '../api/pedidos'
import type { FiltrosPedidos } from '../types/pedido'

// Los filtros van en la queryKey: «Mis pedidos» ({ propios: true }) y el panel del admin
// ({ estado }) piden lo mismo con filtros distintos y cada uno tiene su entrada en la caché
export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: ['pedidos', filtros],
    queryFn: () => listarPedidos(filtros),
    // Al cambiar de página sigue mostrando la anterior hasta que llega la nueva
    placeholderData: keepPreviousData,
  })
}
