// La API pública de la feature productos: el carrito usa useProductosPorId y el router, el
// catálogo. La página del panel no va acá: el router la carga aparte (lazy, H112)
export { useProductosPorId } from './hooks/useProductosPorId'
export { default as CatalogoPage } from './pages/CatalogoPage'
export type { Producto } from './types/producto'
