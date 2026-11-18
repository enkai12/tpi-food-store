import { useQuery } from '@tanstack/react-query'
import { listarUsuarios } from '../api/usuarios'

// La usan la tabla de usuarios y la de pedidos (para mostrar el nombre de cada cliente)
export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios })
}
