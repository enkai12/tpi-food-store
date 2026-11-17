// Precios en pesos con el formato argentino: $ 9.000 o $ 1.500,50. Lo usan el catálogo, el
// carrito y los pedidos
const conDecimales = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const sinDecimales = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatearPrecio(valor: number): string {
  return (Number.isInteger(valor) ? sinDecimales : conDecimales).format(valor)
}
