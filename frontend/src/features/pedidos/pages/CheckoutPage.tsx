import { Link, Navigate, useNavigate } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import Card from '@/shared/ui/Card'
import { formatearPrecio } from '@/shared/utils/formato'
import { subtotal, useCartStore } from '@/store/cartStore'
import CheckoutForm from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/useCrearPedido'
import type { PedidoCreate } from '../types/pedido'

function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore.getState().vaciar
  const navigate = useNavigate()
  const crear = useCrearPedido()

  // Sin nada que pedir, vuelve al carrito. Salvo que el pedido ya se haya creado: al
  // confirmar se vacía el carrito, y esa pantalla se pinta antes de que React Router
  // termine de navegar a «Mis pedidos» (la navegación va en una transition)
  if (items.length === 0 && !crear.isSuccess) return <Navigate to="/carrito" replace />

  function confirmar(datos: Omit<PedidoCreate, 'items'>) {
    // Al backend van solo el id y la cantidad: el precio y el stock los pone y controla él
    const pedido: PedidoCreate = {
      ...datos,
      items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
    }
    crear.mutate(pedido, {
      onSuccess: (creado) => {
        vaciar()
        // replace: «Atrás» no vuelve a un checkout que ya no tiene carrito
        navigate('/mis-pedidos', { replace: true, state: { creado: creado.id } })
      },
    })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Confirmar pedido</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold text-stone-900">Tu pedido</h2>
          <ul className="space-y-1 text-sm text-stone-700">
            {items.map((item) => (
              <li key={item.producto_id} className="flex justify-between gap-3">
                <span className="min-w-0 wrap-anywhere">
                  {item.cantidad} × {item.nombre}
                </span>
                <span className="whitespace-nowrap">{formatearPrecio(subtotal(item))}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-stone-200 pt-3 font-bold">
            <span>Total</span>
            <span>{formatearPrecio(total)}</span>
          </div>
          {/* El precio que vale es el del momento de confirmar: lo pone el backend */}
          <p className="text-xs text-stone-500">Se cobra el precio vigente al confirmar.</p>
          <Link to="/carrito" className="inline-block text-sm font-semibold text-red-700 hover:underline">
            Volver al carrito
          </Link>
        </Card>

        <Card className="p-4">
          <CheckoutForm
            onConfirmar={confirmar}
            enviando={crear.isPending}
            // Por ejemplo, el 400 «Stock insuficiente…» si alguien compró antes
            error={crear.isError ? handleApiError(crear.error, 'No se pudo confirmar el pedido') : undefined}
          />
        </Card>
      </div>
    </div>
  )
}

export default CheckoutPage
