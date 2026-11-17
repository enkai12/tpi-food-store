import { useEffect, useState } from 'react'

// Devuelve el valor recién cuando dejó de cambiar durante «demora» ms. En la búsqueda, el
// pedido sale cuando se deja de escribir y no con cada letra
export function useDebounce<T>(valor: T, demora = 300): T {
  const [diferido, setDiferido] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setDiferido(valor), demora)
    return () => clearTimeout(id) // si cambia antes, se cancela el anterior
  }, [valor, demora])
  return diferido
}
