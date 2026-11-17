import Button from '../ui/Button'

interface EstadoErrorProps {
  mensaje: string // el de handleApiError
  onReintentar?: () => void // si viene, muestra «Reintentar» (por ejemplo, refetch de la query)
}

// role="alert": un lector de pantalla lo anuncia apenas aparece
function EstadoError({ mensaje, onReintentar }: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <p>{mensaje}</p>
      {onReintentar && (
        <Button variante="peligro" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export default EstadoError
