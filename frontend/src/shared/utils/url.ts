// Un entero positivo de la URL, o undefined si falta o no es válido (?pagina=abc). Lo usan
// el catálogo y «Mis pedidos» para leer la página y los filtros
export function leerEntero(valor: string | null): number | undefined {
  const n = Number(valor)
  return valor && Number.isInteger(n) && n > 0 ? n : undefined
}
