// Los estados del pedido, iguales a los del backend (EstadoPedido en pedidos/schemas.py)
export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO'

// La máquina de estados (RN-02), igual a TRANSICIONES en pedidos/service.py: a qué estados se
// puede pasar desde cada uno. Los botones del panel salen de acá, así nunca ofrecen un cambio
// que el backend rechazaría. Record obliga a cubrir los cuatro estados
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
}

// El texto del botón que lleva a cada estado
export const ACCION_HACIA: Record<EstadoPedido, string> = {
  PENDIENTE: 'Volver a pendiente', // no hay transición hacia PENDIENTE: nunca se muestra
  EN_PREPARACION: 'Pasar a preparación',
  ENTREGADO: 'Marcar entregado',
  CANCELADO: 'Cancelar',
}

// RN-06: las dos formas de pago que acepta el backend
export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA'

// El texto de cada una: las opciones del checkout y lo que muestra el detalle del pedido
export const FORMAS_PAGO: { valor: FormaPago; texto: string }[] = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
]

// Una línea del pedido (DetallePedidoRead): el nombre y el precio son copias del momento
// de la compra, así el pedido no cambia si después cambia el producto (RN-05)
export interface DetallePedido {
  producto_id: number
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

// Lo que devuelve el backend (PedidoRead). Las fechas llegan como texto ISO con zona
export interface Pedido {
  id: number
  usuario_id: number
  estado: EstadoPedido
  forma_pago: FormaPago
  direccion_entrega: string
  notas: string | null
  total: number
  created_at: string
  updated_at: string
  items: DetallePedido[]
}

// Una página del listado: total cuenta todos los que cumplen los filtros
export interface PedidosPaginados {
  total: number
  items: Pedido[]
}

// El cuerpo de POST /pedidos (PedidoCreate): solo id y cantidad; el precio lo pone el backend
export interface PedidoCreate {
  items: { producto_id: number; cantidad: number }[]
  forma_pago: FormaPago
  direccion_entrega: string
  notas?: string
}

// Los parámetros de GET /pedidos. Los opcionales que quedan en undefined, Axios no los manda
export interface FiltrosPedidos {
  skip: number
  limit: number
  estado?: EstadoPedido
  propios?: boolean
}

// Los indicadores del panel (ResumenPedidos): los conteos por estado, los pedidos de hoy y la
// suma de los totales de los pedidos ENTREGADO
export interface ResumenPedidos {
  pendientes: number
  en_preparacion: number
  entregados: number
  cancelados: number
  pedidos_hoy: number
  ingresos_entregados: number
}
