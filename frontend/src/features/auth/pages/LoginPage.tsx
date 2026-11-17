import { useForm, useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Input from '@/shared/ui/Input'
import { errorDeCampo } from '@/shared/utils/errorDeCampo'
import { useAuthStore } from '@/store/authStore'
import type { LoginData } from '../types/auth'

const valoresIniciales: LoginData = { username: '', password: '' }

function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  // ProtectedRoute me manda acá con la ruta que se quería ver, para volver después
  const desde = (useLocation().state as { desde?: string } | null)?.desde ?? '/'

  // El estado del envío (isPending, error) lo lleva TanStack Query, no el store
  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginData) => login(username, password),
  })

  const form = useForm({
    defaultValues: valoresIniciales,
    // mutate y no mutateAsync: el error queda en loginMutation.error y no se propaga
    onSubmit: ({ value }) => loginMutation.mutate(value),
  })
  const intentoEnviar = useStore(form.store, (s) => s.submissionAttempts > 0)

  // Con sesión (recién iniciada o de antes) voy a donde se quería ir
  if (usuario) return <Navigate to={desde} replace />

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Iniciar sesión</h1>
      <Card>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault() // sin esto el navegador recarga la página
            form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
          >
            {(field) => (
              <Input
                label="Usuario"
                name={field.name}
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={errorDeCampo(field, intentoEnviar)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                name={field.name}
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={errorDeCampo(field, intentoEnviar)}
              />
            )}
          </form.Field>

          {/* «Credenciales incorrectas» o «Cuenta de usuario desactivada», sin recargar */}
          {loginMutation.isError && (
            <EstadoError mensaje={handleApiError(loginMutation.error, 'No se pudo iniciar sesión')} />
          )}

          <Button type="submit" cargando={loginMutation.isPending}>
            Ingresar
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-stone-600">
        ¿No tenés cuenta?{' '}
        <Link to="/register" state={{ desde }} className="font-semibold text-red-700 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
