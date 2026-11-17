import axios, { type AxiosError } from 'axios'

// La URL de la API sale del .env. Si falta, corto acá con un mensaje claro: si no, cada
// pedido iría al servidor de Vite y daría un 404 sin ninguna explicación
const baseURL = import.meta.env.VITE_API_URL
if (!baseURL) {
  throw new Error('Falta VITE_API_URL en el .env del frontend (ver .env.example)')
}

// Una sola instancia para toda la app
export const api = axios.create({
  baseURL,
  timeout: 10_000,
  // Hace que el navegador guarde la cookie del login y la mande en cada pedido.
  // El token viaja solo en esa cookie HttpOnly: desde JavaScript no lo puedo leer
  withCredentials: true,
})

// Lo que hay que hacer cuando la sesión termina. Lo registra el store, así este archivo
// no lo importa
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

// En el login, el 401 (credenciales incorrectas) y el 400 (cuenta desactivada) los muestra
// el formulario, y el error de /auth/me ya lo maneja checkSession
const RUTAS_DE_AUTH = ['/auth/token', '/auth/me']
const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

// La sesión terminó si el token venció o no está (401), o si el admin desactivó la cuenta
// mientras estaba abierta (400 con ese detail)
function terminoLaSesion(error: AxiosError): boolean {
  const status = error.response?.status
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
  return status === 401 || (status === 400 && detail === CUENTA_DESACTIVADA)
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Comparo la ruta entera: con includes sobre el texto, otra ruta que contuviera
    // /auth/me quedaría excluida sin querer
    const esDeAuth = RUTAS_DE_AUTH.includes(error.config?.url ?? '')
    if (!esDeAuth && terminoLaSesion(error)) {
      // Limpio el store y ProtectedRoute me manda al login
      onUnauthorized?.()
    }
    // Lo devuelvo igual, para que quien hizo el pedido también se entere del error
    return Promise.reject(error)
  },
)
