import { api } from '@/shared/api/axiosInstance'
import type {
  EstadoPedido,
  FiltrosPedidos,
  Pedido,
  PedidoCreate,
  PedidosPaginados,
  ResumenPedidos,
} from '../types/pedido'

// RN-01: el backend valida stock y disponibilidad, copia nombre y precio, y descuenta el stock
export async function crearPedido(datos: PedidoCreate): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/pedidos', datos)
  return data
}

// Axios arma la query string con params: ?skip=0&limit=10&propios=true
export async function listarPedidos(filtros: FiltrosPedidos): Promise<PedidosPaginados> {
  const { data } = await api.get<PedidosPaginados>('/pedidos', { params: filtros })
  return data
}

// RN-03 y RN-04: solo el dueño y solo en PENDIENTE; el backend restituye el stock
export async function cancelarPedido(id: number): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/cancelar`)
  return data
}

// Solo admin: avanza o cancela según la máquina de estados (RN-02). 400 si la transición no
// vale (por ejemplo, otro admin ya lo entregó); al cancelar, el backend restituye el stock
export async function cambiarEstadoPedido(id: number, estado: EstadoPedido): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })
  return data
}

// Solo admin. «Hoy» lo calcula el backend desde las 00:00 de su zona horaria (H15)
export async function obtenerResumen(): Promise<ResumenPedidos> {
  const { data } = await api.get<ResumenPedidos>('/pedidos/resumen')
  return data
}
