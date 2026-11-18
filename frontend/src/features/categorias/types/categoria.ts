// Lo que devuelve el backend (CategoriaRead)
export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

// Lo que manda el panel al crear (CategoriaCreate) o editar (CategoriaUpdate). Al editar van
// los dos campos: descripcion en null la borra
export interface CategoriaDatos {
  nombre: string
  descripcion: string | null
}
