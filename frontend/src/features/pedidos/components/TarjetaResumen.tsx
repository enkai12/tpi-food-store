import Card from '@/shared/ui/Card'

interface TarjetaResumenProps {
  titulo: string
  valor: string // ya formateado: «3» o «$ 21.600»
  detalle?: string // una aclaración chica debajo del valor
}

// Un indicador del panel: el número grande y qué cuenta. El título va primero en el HTML
// (un lector de pantalla dice «Pendientes, 3»)
function TarjetaResumen({ titulo, valor, detalle }: TarjetaResumenProps) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-medium text-stone-600">{titulo}</h2>
      <p className="mt-1 text-3xl font-bold text-stone-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-stone-500">{detalle}</p>}
    </Card>
  )
}

export default TarjetaResumen
