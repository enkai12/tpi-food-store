import axios from 'axios'

// Convierte un error de la API en el mensaje que se muestra en pantalla. El backend manda
// el motivo en detail: un texto en los 400, 401, 403, 404 y 409, y una lista con un error
// por campo en el 422 de validación
export function handleApiError(error: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  if (!axios.isAxiosError(error)) return porDefecto
  // Sin respuesta: el backend está apagado, no contestó a tiempo o CORS la bloqueó
  if (!error.response) return 'No se pudo conectar con el servidor'

  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    // Me quedo con el msg de cada error. Los validadores propios llegan como
    // «Value error, <mensaje>»: saco ese prefijo
    const mensajes = detail
      .map((item) => (item as { msg?: unknown } | null)?.msg)
      .filter((msg): msg is string => typeof msg === 'string')
      .map((msg) => msg.replace(/^Value error, /, ''))
    // Sin repetidos: dos campos pueden fallar por lo mismo
    if (mensajes.length > 0) return [...new Set(mensajes)].join('. ')
  }

  // Por ejemplo, un 500: su cuerpo no es JSON y no trae detail
  return porDefecto
}
