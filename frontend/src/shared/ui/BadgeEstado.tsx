import type { EstadoPedido } from '@/features/pedidos'

// Record obliga a cubrir los cuatro estados: si el backend sumara uno, TypeScript marcaría
// este objeto hasta agregarlo
const ESTADOS: Record<EstadoPedido, { texto: string; clases: string }> = {
  PENDIENTE: { texto: 'Pendiente', clases: 'bg-amber-100 text-amber-900' },
  EN_PREPARACION: { texto: 'En preparación', clases: 'bg-sky-100 text-sky-900' },
  ENTREGADO: { texto: 'Entregado', clases: 'bg-green-100 text-green-900' },
  CANCELADO: { texto: 'Cancelado', clases: 'bg-stone-200 text-stone-700' },
}

function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const { texto, clases } = ESTADOS[estado]
  return (
    <span className={`inline-block rounded-full whitespace-nowrap px-2.5 py-0.5 text-xs font-semibold ${clases}`}>
      {texto}
    </span>
  )
}

export default BadgeEstado
