import { useQuery } from '@tanstack/react-query'
import { obtenerResumen } from '../api/pedidos'

// La clave empieza con 'pedidos' a propósito: cualquier mutación que invalide ['pedidos']
// (crear, cancelar, cambiar el estado) también deja viejo el resumen, sin código extra
export function useResumenPedidos() {
  return useQuery({ queryKey: ['pedidos', 'resumen'], queryFn: obtenerResumen })
}
