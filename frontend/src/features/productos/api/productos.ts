import { api } from '@/shared/api/axiosInstance'
import type { FiltrosProductos, ProductosPaginados } from '../types/producto'

// Axios arma la query string con params: ?skip=12&limit=12&search=empanada
export async function listarProductos(filtros: FiltrosProductos): Promise<ProductosPaginados> {
  const { data } = await api.get<ProductosPaginados>('/productos', { params: filtros })
  return data
}
