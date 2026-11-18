import { api } from '@/shared/api/axiosInstance'
import type {
  FiltrosProductos,
  Producto,
  ProductoDatos,
  ProductoEdicion,
  ProductosPaginados,
  StockDatos,
} from '../types/producto'

// Axios arma la query string con params: ?skip=12&limit=12&search=empanada
export async function listarProductos(filtros: FiltrosProductos): Promise<ProductosPaginados> {
  const { data } = await api.get<ProductosPaginados>('/productos', { params: filtros })
  return data
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const { data } = await api.get<Producto>(`/productos/${id}`)
  return data
}

// Las cuatro siguientes son solo del admin. 404 si el producto ya no está, o si la categoría
// (nueva) no existe o está dada de baja
export async function crearProducto(datos: ProductoDatos): Promise<Producto> {
  const { data } = await api.post<Producto>('/productos', datos)
  return data
}

export async function editarProducto(id: number, datos: ProductoEdicion): Promise<Producto> {
  const { data } = await api.put<Producto>(`/productos/${id}`, datos)
  return data
}

export async function cambiarStock(id: number, datos: StockDatos): Promise<Producto> {
  const { data } = await api.patch<Producto>(`/productos/${id}/stock`, datos)
  return data
}

// Baja lógica: el backend responde 204, sin cuerpo. Los pedidos que lo tienen no cambian
export async function eliminarProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}
