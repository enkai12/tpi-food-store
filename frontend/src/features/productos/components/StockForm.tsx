import { useForm, useStore } from '@tanstack/react-form'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { leerCantidad } from '@/shared/utils/numero'
import type { Producto, StockDatos } from '../types/producto'

interface StockFormProps {
  producto: Producto
  onConfirmar: (datos: StockDatos) => void
  onCancelar: () => void
  enviando: boolean
  error?: string
}

// El cambio de stock y disponibilidad que pide la consigna (PATCH /productos/{id}/stock).
// Los dos van siempre: el backend los pide obligatorios (H31)
function StockForm({ producto, onConfirmar, onCancelar, enviando, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: ({ value }) =>
      onConfirmar({ stock: leerCantidad(value.stock) ?? 0, disponible: value.disponible }),
  })
  const intentoEnviar = useStore(form.store, (s) => s.submissionAttempts > 0)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) =>
            leerCantidad(value) === undefined ? 'Un número entero, de 0 en adelante' : undefined,
        }}
      >
        {(field) => (
          <Input
            label="Stock"
            name={field.name}
            inputMode="numeric"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              name={field.name}
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-red-700"
            />
            Disponible para pedir
          </label>
        )}
      </form.Field>

      {/* Que se entienda la diferencia: sin stock no se puede pedir aunque esté disponible */}
      <p className="text-xs text-stone-500">
        Con stock 0 no se puede pedir. «No disponible» tampoco deja pedirlo aunque tenga stock
        (por ejemplo, si falta un ingrediente). En los dos casos sigue en el catálogo, con un aviso.
      </p>

      {error && <EstadoError mensaje={error} />}

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          Guardar
        </Button>
      </div>
    </form>
  )
}

export default StockForm
