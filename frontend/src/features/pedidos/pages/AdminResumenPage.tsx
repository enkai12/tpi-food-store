import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import Skeleton from '@/shared/components/Skeleton'
import { formatearPrecio } from '@/shared/utils/formato'
import TarjetaResumen from '../components/TarjetaResumen'
import { useResumenPedidos } from '../hooks/useResumenPedidos'

function AdminResumenPage() {
  const resumen = useResumenPedidos()

  function contenido() {
    if (resumen.isPending) {
      return <Skeleton cantidad={6} alto="h-28" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
    }
    if (resumen.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(resumen.error, 'No se pudo cargar el resumen')}
          onReintentar={() => resumen.refetch()}
        />
      )
    }
    const r = resumen.data
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaResumen titulo="Pendientes" valor={String(r.pendientes)} />
        <TarjetaResumen titulo="En preparación" valor={String(r.en_preparacion)} />
        <TarjetaResumen titulo="Entregados" valor={String(r.entregados)} />
        <TarjetaResumen titulo="Cancelados" valor={String(r.cancelados)} />
        <TarjetaResumen titulo="Pedidos de hoy" valor={String(r.pedidos_hoy)} detalle="Desde las 00:00, en cualquier estado" />
        <TarjetaResumen
          titulo="Ingresos"
          valor={formatearPrecio(r.ingresos_entregados)}
          detalle="Suma de los pedidos entregados"
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Resumen</h1>
      {contenido()}
    </div>
  )
}

export default AdminResumenPage
