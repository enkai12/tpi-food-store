// La API pública de la feature categorías: useCategorias la usan el catálogo y el ABM de
// productos. La página del panel no va acá: el router la carga aparte (lazy, H112)
export { useCategorias } from './hooks/useCategorias'
export type { Categoria } from './types/categoria'
