// La API pública de la feature productos: el carrito usa useProductosPorId y el router, las páginas
export { useProductosPorId } from './hooks/useProductosPorId'
export { default as AdminProductosPage } from './pages/AdminProductosPage'
export { default as CatalogoPage } from './pages/CatalogoPage'
export type { Producto } from './types/producto'
