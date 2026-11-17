import { useQuery } from '@tanstack/react-query'
import { listarCategorias } from '../api/categorias'

// La misma queryKey en el filtro del catálogo y en el panel: comparten la caché, y una
// mutación del panel la invalida para todos
export function useCategorias() {
  return useQuery({ queryKey: ['categorias'], queryFn: listarCategorias })
}
