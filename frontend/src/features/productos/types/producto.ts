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

// Lo que manda el panel al crear (ProductoCreate). Al editar van los mismos campos menos
// stock y disponible, que se cambian aparte con PATCH /stock (H103)
export interface ProductoDatos {
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  categoria_id: number
}

export type ProductoEdicion = Omit<ProductoDatos, 'stock' | 'disponible'>

// El cuerpo de PATCH /productos/{id}/stock (ProductoStockUpdate): los dos son obligatorios
export interface StockDatos {
  stock: number
  disponible: boolean
}
