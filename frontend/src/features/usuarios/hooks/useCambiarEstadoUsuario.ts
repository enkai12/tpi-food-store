import { useMutation, useQueryClient } from '@tanstack/react-query'
import { activarUsuario, desactivarUsuario } from '../api/usuarios'

// Activar y desactivar son dos endpoints, pero para la pantalla es la misma acción: cambiar
// el estado de una cuenta. activo dice a cuál llamar
export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      activo ? activarUsuario(id) : desactivarUsuario(id),
    // También con error: un 404 es que la cuenta ya no está, y la tabla se pone al día
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}
