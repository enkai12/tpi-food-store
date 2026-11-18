import type { Usuario } from '@/features/auth'
import { api } from '@/shared/api/axiosInstance'

// Solo admin. El backend devuelve todos, ordenados por id (H38), sin paginar
export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/admin/usuarios')
  return data
}

// Alta y baja lógica (disabled). 404 si no existe; desactivarse a uno mismo da 400 (H37)
export async function activarUsuario(id: number): Promise<Usuario> {
  const { data } = await api.post<Usuario>(`/admin/usuarios/${id}/activar`)
  return data
}

export async function desactivarUsuario(id: number): Promise<Usuario> {
  const { data } = await api.post<Usuario>(`/admin/usuarios/${id}/desactivar`)
  return data
}
