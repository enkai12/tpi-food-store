import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { FORMAS_PAGO, type Pedido } from '../types/pedido'

// El detalle que se despliega en «Mis pedidos»: las líneas con el nombre y el precio que se
// cobraron (copias, RN-05) y los datos de la entrega. Se llama PedidoDetalle y no
// DetallePedido para no chocar con el tipo de la línea, que lleva el nombre de la consigna
function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  const formaPago = FORMAS_PAGO.find((f) => f.valor === pedido.forma_pago)?.texto
  const notas = pedido.notas?.trim()

  return (
    <div className="space-y-4 text-sm">
      <table className="w-full">
        <caption className="sr-only">Productos del pedido {pedido.id}</caption>
        <thead>
          <tr className="text-left text-xs text-stone-500">
            <th scope="col" className="pb-1 font-medium">Producto</th>
            <th scope="col" className="pb-1 text-right font-medium">Cant.</th>
            <th scope="col" className="pb-1 text-right font-medium">Precio</th>
            <th scope="col" className="pb-1 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {/* producto_id no se repite: el backend rechaza un producto repetido */}
          {pedido.items.map((item) => (
            <tr key={item.producto_id} className="border-t border-stone-100">
              <td className="py-1.5 pr-2 wrap-anywhere">{item.nombre_producto}</td>
              <td className="py-1.5 text-right">{item.cantidad}</td>
              <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                {formatearPrecio(item.precio_unitario)}
              </td>
              <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                {formatearPrecio(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-stone-300 font-semibold text-stone-900">
            <td colSpan={3} className="pt-1.5 text-right">
              Total
            </td>
            <td className="pt-1.5 pl-2 text-right whitespace-nowrap">
              {formatearPrecio(pedido.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-stone-700">
        <dt className="text-stone-500">Entrega</dt>
        <dd className="wrap-anywhere">{pedido.direccion_entrega}</dd>
        <dt className="text-stone-500">Pago</dt>
        <dd>{formaPago}</dd>
        {notas && (
          <>
            <dt className="text-stone-500">Notas</dt>
            <dd className="wrap-anywhere">{notas}</dd>
          </>
        )}
        <dt className="text-stone-500">Último cambio</dt>
        <dd>{formatearFecha(pedido.updated_at)}</dd>
      </dl>
    </div>
  )
}

export default PedidoDetalle
