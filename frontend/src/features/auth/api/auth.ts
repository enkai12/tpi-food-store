import { api } from '@/shared/api/axiosInstance'
import type { RegistroData, Usuario } from '../types/auth'

// Las funciones solo hacen el pedido: si falla, el error sigue hasta la pantalla, que arma
// el mensaje con handleApiError

// OAuth2 pide un formulario, no JSON: con URLSearchParams Axios lo manda como
// application/x-www-form-urlencoded. La respuesta deja la cookie; el cuerpo es solo un mensaje
export async function login(username: string, password: string): Promise<void> {
  await api.post('/auth/token', new URLSearchParams({ username, password }))
}

export async function me(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me')
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function registrar(datos: RegistroData): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/register', datos)
  return data
}
