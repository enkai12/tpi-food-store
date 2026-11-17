import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

// Reintento solo si el problema puede ser pasajero: no hubo respuesta (red, backend
// caído o timeout) o el servidor falló (5xx). Un 4xx va a dar lo mismo la próxima vez, y
// con los 3 reintentos por defecto el error tardaría varios segundos en mostrarse.
// fallas cuenta las anteriores (empieza en 0): son hasta 2 reintentos, 3 pedidos en total
function convieneReintentar(fallas: number, error: Error): boolean {
  if (fallas >= 2 || !axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === undefined || status >= 500
}

// Se crea una sola vez, afuera de los componentes, para que la caché no se reinicie.
// La exporto para que el store pueda vaciarla cuando termina una sesión
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: convieneReintentar,
      // Durante 30 s los datos se consideran frescos: montar otra pantalla con la misma
      // queryKey no repite el pedido. Lo que cambia por una acción del usuario se refresca
      // igual con invalidateQueries en el onSuccess de cada mutación
      staleTime: 30_000,
    },
    // Las mutaciones quedan sin reintentos (el valor por defecto): repetir un POST podría,
    // por ejemplo, crear el mismo pedido dos veces
  },
})
