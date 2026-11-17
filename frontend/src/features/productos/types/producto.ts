import type { Categoria } from '@/features/categorias'

// Lo que devuelve el backend (ProductoRead), con su categoría anidada
export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  activo: boolean
  categoria_id: number
  categoria: Categoria
}

// Una página del listado: total cuenta todos los que cumplen los filtros
export interface ProductosPaginados {
  total: number
  items: Producto[]
}

// Los parámetros de GET /productos. Los opcionales que quedan en undefined, Axios no los manda
export interface FiltrosProductos {
  skip: number
  limit: number
  search?: string
  categoria_id?: number
  disponible?: boolean
}
