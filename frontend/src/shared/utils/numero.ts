// El mayor entero que guarda una columna integer de PostgreSQL (ENTERO_MAX en el backend)
export const ENTERO_MAX = 2_147_483_647

// Un precio escrito como en Argentina: «1500», «1500,50» o «1500.5», con hasta dos
// decimales y sin separador de miles. undefined si no es un precio válido
export function leerPrecio(texto: string): number | undefined {
  const limpio = texto.trim()
  if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) return undefined
  const valor = Number(limpio.replace(',', '.'))
  return Number.isFinite(valor) ? valor : undefined
}

// Un entero de 0 en adelante que entre en la columna (stock). undefined si no lo es
export function leerCantidad(texto: string): number | undefined {
  const limpio = texto.trim()
  if (!/^\d+$/.test(limpio)) return undefined
  const valor = Number(limpio)
  return valor <= ENTERO_MAX ? valor : undefined
}
