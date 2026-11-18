import { useForm, useStore } from '@tanstack/react-form'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'
import Select from '@/shared/ui/Select'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { largo } from '@/shared/utils/texto'
import { FORMAS_PAGO, type FormaPago, type PedidoCreate } from '../types/pedido'

// Lo que se escribe en el formulario; los ítems los pone la página desde el carrito
interface ValoresCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string
}

const valoresIniciales: ValoresCheckout = {
  direccion_entrega: '',
  forma_pago: 'EFECTIVO',
  notas: '',
}

// Los mismos límites que el backend (RN-06), contados sin los espacios de los extremos
function validarDireccion(valor: string): string | undefined {
  const texto = valor.trim()
  if (!texto) return 'Ingresá la dirección de entrega'
  if (largo(texto) < 5) return 'Mínimo 5 caracteres'
  if (largo(texto) > 200) return 'Máximo 200 caracteres'
  return undefined
}

function validarNotas(valor: string): string | undefined {
  return largo(valor.trim()) > 500 ? 'Máximo 500 caracteres' : undefined
}

interface CheckoutFormProps {
  onConfirmar: (datos: Omit<PedidoCreate, 'items'>) => void
  enviando: boolean
  error?: string // el de handleApiError, por ejemplo un 400 de stock
}

function CheckoutForm({ onConfirmar, enviando, error }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: valoresIniciales,
    // Las notas en blanco no se mandan: el backend guardaría el texto vacío tal cual
    onSubmit: ({ value }) =>
      onConfirmar({
        direccion_entrega: value.direccion_entrega.trim(),
        forma_pago: value.forma_pago,
        notas: value.notas.trim() || undefined,
      }),
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
        name="direccion_entrega"
        validators={{ onChange: ({ value }) => validarDireccion(value) }}
      >
        {(field) => (
          <Input
            label="Dirección de entrega"
            name={field.name}
            autoComplete="street-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Select
            label="Forma de pago"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            // La busco en la lista: así no hace falta un cast y solo entra un valor que existe
            onChange={(e) => {
              const elegida = FORMAS_PAGO.find((f) => f.valor === e.target.value)
              if (elegida) field.handleChange(elegida.valor)
            }}
          >
            {FORMAS_PAGO.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.texto}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field name="notas" validators={{ onChange: ({ value }) => validarNotas(value) }}>
        {(field) => (
          <Input
            label="Notas (opcional)"
            name={field.name}
            placeholder="Ej.: tocar timbre B"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      {error && <EstadoError mensaje={error} />}

      <Button type="submit" cargando={enviando}>
        Confirmar pedido
      </Button>
    </form>
  )
}

export default CheckoutForm
