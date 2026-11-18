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

// Fecha y hora en la zona del navegador: 18/11/26, 10:14. El backend manda el instante con
// su zona (2026-11-18T10:14:38-03:00, H34) y Date lo convierte solo
const fechaHora = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  hourCycle: 'h23', // 24 horas: 18:30 y no 6:30 p. m.
})

export function formatearFecha(iso: string): string {
  return fechaHora.format(new Date(iso))
}
