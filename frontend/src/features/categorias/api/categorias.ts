import { api } from '@/shared/api/axiosInstance'
import type { Categoria, CategoriaDatos } from '../types/categoria'

// Público: devuelve solo las categorías activas
export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias')
  return data
}

// Las tres siguientes son solo del admin. 409 si el nombre ya existe (aunque cambien las
// mayúsculas o la otra esté dada de baja); 404 si la categoría ya no está
export async function crearCategoria(datos: CategoriaDatos): Promise<Categoria> {
  const { data } = await api.post<Categoria>('/categorias', datos)
  return data
}

export async function editarCategoria(id: number, datos: CategoriaDatos): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, datos)
  return data
}

// Baja lógica: el backend responde 204, sin cuerpo
export async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
