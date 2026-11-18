import { useForm, useStore } from '@tanstack/react-form'
import type { Categoria } from '@/features/categorias'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'
import Select from '@/shared/ui/Select'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { leerCantidad, leerPrecio } from '@/shared/utils/numero'
import { largo } from '@/shared/utils/texto'
import type { Producto, ProductoDatos } from '../types/producto'

// Lo que se escribe: los números como texto, para validarlos al escribir y aceptar la coma
interface ValoresProducto {
  nombre: string
  descripcion: string
  precio: string
  imagen_url: string
  categoria_id: string // '' hasta que se elige
  stock: string
  disponible: boolean
}

// Los límites del backend (ProductoCreate), contados en caracteres como Python (H92)
function validarNombre(valor: string): string | undefined {
  const texto = valor.trim()
  if (!texto) return 'Ingresá un nombre'
  if (largo(texto) > 100) return 'Máximo 100 caracteres'
  return undefined
}

const hastaQuinientos = (valor: string) =>
  largo(valor.trim()) > 500 ? 'Máximo 500 caracteres' : undefined

function validarImagen(valor: string): string | undefined {
  const texto = valor.trim()
  if (!texto) return undefined
  // El backend acepta cualquier texto, pero una dirección mal escrita deja la tarjeta sin foto
  if (!/^https?:\/\/\S+$/.test(texto)) return 'Tiene que empezar con http:// o https://'
  return hastaQuinientos(texto)
}

interface ProductoFormProps {
  producto: Producto | null // null: uno nuevo; si no, el que se edita
  categorias: Categoria[] // las activas
  onConfirmar: (datos: ProductoDatos) => void
  onCancelar: () => void
  enviando: boolean
  error?: string
}

// Crear y editar. Al editar no se muestran el stock ni la disponibilidad: se cambian con
// «Stock», que llama a PATCH /stock (H103). La página le pone una key distinta en cada caso
function ProductoForm({ producto, categorias, onConfirmar, onCancelar, enviando, error }: ProductoFormProps) {
  // Si la categoría del producto se dio de baja, no está entre las activas: la sumo para que
  // el Select muestre la que tiene. El backend deja guardarla mientras no cambie (H45, H102)
  const opciones =
    producto && !categorias.some((c) => c.id === producto.categoria_id)
      ? [...categorias, producto.categoria]
      : categorias

  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      // Con coma, como lo escribe una persona: 1500,5 y no 1500.5
      precio: producto ? String(producto.precio_base).replace('.', ',') : '',
      imagen_url: producto?.imagen_url ?? '',
      categoria_id: producto ? String(producto.categoria_id) : '',
      stock: producto ? String(producto.stock) : '0',
      disponible: producto?.disponible ?? true,
    } satisfies ValoresProducto,
    // Los validadores ya garantizan que precio, stock y categoría se pueden leer
    onSubmit: ({ value }) =>
      onConfirmar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: leerPrecio(value.precio) ?? 0,
        imagen_url: value.imagen_url.trim() || null,
        categoria_id: Number(value.categoria_id),
        stock: leerCantidad(value.stock) ?? 0,
        disponible: value.disponible,
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

      <form.Field name="descripcion" validators={{ onChange: ({ value }) => hastaQuinientos(value) }}>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="precio"
          validators={{
            onChange: ({ value }) =>
              !value.trim()
                ? 'Ingresá el precio'
                : leerPrecio(value) === undefined
                  ? 'Un número, con hasta dos decimales'
                  : undefined,
          }}
        >
          {(field) => (
            <Input
              label="Precio"
              name={field.name}
              inputMode="decimal"
              placeholder="Ej.: 1500 o 1500,50"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={errorDeCampo(field, intentoEnviar)}
            />
          )}
        </form.Field>

        <form.Field
          name="categoria_id"
          validators={{ onChange: ({ value }) => (value ? undefined : 'Elegí una categoría') }}
        >
          {(field) => (
            <Select
              label="Categoría"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={errorDeCampo(field, intentoEnviar)}
            >
              <option value="">Elegí una</option>
              {opciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.activo ? c.nombre : `${c.nombre} (dada de baja)`}
                </option>
              ))}
            </Select>
          )}
        </form.Field>
      </div>

      <form.Field name="imagen_url" validators={{ onChange: ({ value }) => validarImagen(value) }}>
        {(field) => (
          <Input
            label="Imagen (URL, opcional)"
            name={field.name}
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={errorDeCampo(field, intentoEnviar)}
          />
        )}
      </form.Field>

      {/* El stock inicial y la disponibilidad, solo al crear */}
      {!producto && (
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <form.Field
            name="stock"
            validators={{
              onChange: ({ value }) =>
                leerCantidad(value) === undefined ? 'Un número entero, de 0 en adelante' : undefined,
            }}
          >
            {(field) => (
              <Input
                label="Stock inicial"
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
              <label className="flex items-center gap-2 py-2 text-sm text-stone-700">
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
        </div>
      )}

      {error && <EstadoError mensaje={error} />}

      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          {producto ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}

export default ProductoForm
