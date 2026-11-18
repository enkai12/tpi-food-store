import { useForm, useStore } from '@tanstack/react-form'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { largo } from '@/shared/utils/texto'
import type { Categoria, CategoriaDatos } from '../types/categoria'

// Los mismos límites que el backend (CategoriaCreate), contados sin los espacios de los
// extremos y en caracteres, como Python (H92)
function validarNombre(valor: string): string | undefined {
  const texto = valor.trim()
  if (!texto) return 'Ingresá un nombre'
  if (largo(texto) < 2) return 'Mínimo 2 caracteres'
  if (largo(texto) > 100) return 'Máximo 100 caracteres'
  return undefined
}

function validarDescripcion(valor: string): string | undefined {
  return largo(valor.trim()) > 500 ? 'Máximo 500 caracteres' : undefined
}

interface CategoriaFormProps {
  categoria: Categoria | null // null: una nueva; si no, la que se edita
  onConfirmar: (datos: CategoriaDatos) => void
  onCancelar: () => void
  enviando: boolean
  error?: string // por ejemplo, el 409 «Ya existe una categoría con el nombre …»
}

// Sirve para crear y para editar. La página le pone una key distinta en cada caso, así
// arranca de cero con los valores de la categoría elegida
function CategoriaForm({ categoria, onConfirmar, onCancelar, enviando, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    // Una descripción en blanco va como null: así se borra al editar
    onSubmit: ({ value }) =>
      onConfirmar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
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
      <form.Field name="nombre" validators={{ onChange: ({ value }) => validarNombre(value) }}>
        {(field) => (
          <Input
            label="Nombre"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      <form.Field name="descripcion" validators={{ onChange: ({ value }) => validarDescripcion(value) }}>
        {(field) => (
          <Input
            label="Descripción (opcional)"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      {error && <EstadoError mensaje={error} />}

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          {categoria ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}

export default CategoriaForm
