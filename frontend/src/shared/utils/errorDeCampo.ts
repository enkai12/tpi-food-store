// Lo mínimo que necesito de un campo de TanStack Form
interface CampoConMeta {
  state: { meta: { isBlurred: boolean; errors: unknown[] } }
}

// El error de un campo se muestra recién cuando la persona salió del campo o intentó
// enviar: no tiene sentido marcar «Ingresá tu usuario» mientras todavía está escribiendo
export function errorDeCampo(campo: CampoConMeta, intentoEnviar: boolean): string | undefined {
  if (!campo.state.meta.isBlurred && !intentoEnviar) return undefined
  const [primero] = campo.state.meta.errors
  return typeof primero === 'string' ? primero : undefined
}
