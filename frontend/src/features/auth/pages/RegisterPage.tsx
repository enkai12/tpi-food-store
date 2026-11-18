import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Input from '@/shared/ui/Input'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { largo } from '@/shared/utils/texto'
import { useAuthStore } from '@/store/authStore'
import { registrar } from '../api/auth'
import type { RegistroData } from '../types/auth'

const valoresIniciales: RegistroData = { username: '', full_name: '', email: '', password: '' }

// Los mismos límites que el backend (UserCreate), para avisar antes de enviar
const bytes = (texto: string) => new TextEncoder().encode(texto).length

function validar(campo: keyof RegistroData, valor: string): string | undefined {
  const texto = valor.trim()
  switch (campo) {
    case 'username':
      if (!texto) return 'Ingresá un nombre de usuario'
      if (largo(texto) > 50) return 'Máximo 50 caracteres'
      return undefined
    case 'full_name':
      if (!texto) return 'Ingresá tu nombre'
      if (largo(texto) > 100) return 'Máximo 100 caracteres'
      return undefined
    case 'email':
      if (!texto) return 'Ingresá tu email'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) return 'El email no es válido'
      return undefined
    case 'password':
      // La contraseña no se recorta: un espacio también cuenta
      // En caracteres, como Python: con .length, «abc😀😀😀» mide 9 y el backend lo rechaza (H92)
      if (largo(valor) < 8) return 'Mínimo 8 caracteres'
      // bcrypt usa solo los primeros 72 bytes: una «ñ» ocupa 2 (H18)
      if (bytes(valor) > 72) return 'La contraseña es demasiado larga'
      return undefined
  }
}

const CAMPOS: { name: keyof RegistroData; label: string; type: string; autoComplete: string }[] = [
  { name: 'username', label: 'Usuario', type: 'text', autoComplete: 'username' },
  { name: 'full_name', label: 'Nombre completo', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
]

function RegisterPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const desde = (useLocation().state as { desde?: string } | null)?.desde ?? '/'

  // Creo la cuenta y entro enseguida con los mismos datos: no hace falta escribirlos de
  // nuevo en el login
  const registroMutation = useMutation({
    mutationFn: async (datos: RegistroData) => {
      await registrar(datos)
      await login(datos.username, datos.password)
    },
  })

  const form = useForm({
    defaultValues: valoresIniciales,
    onSubmit: ({ value }) => registroMutation.mutate(value),
  })
  const intentoEnviar = useStore(form.store, (s) => s.submissionAttempts > 0)

  if (usuario) return <Navigate to={desde} replace />

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Crear cuenta</h1>
      <Card>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          {CAMPOS.map((campo) => (
            <form.Field
              key={campo.name}
              name={campo.name}
              validators={{ onChange: ({ value }) => validar(campo.name, value) }}
            >
              {(field) => (
                <Input
                  label={campo.label}
                  name={field.name}
                  type={campo.type}
                  autoComplete={campo.autoComplete}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={errorDeCampo(field, intentoEnviar)}
                />
              )}
            </form.Field>
          ))}

          {/* Por ejemplo, el 409 «El nombre de usuario ya está en uso» */}
          {registroMutation.isError && (
            <EstadoError mensaje={handleApiError(registroMutation.error, 'No se pudo crear la cuenta')} />
          )}

          <Button type="submit" cargando={registroMutation.isPending}>
            Crear cuenta
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-stone-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" state={{ desde }} className="font-semibold text-red-700 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
