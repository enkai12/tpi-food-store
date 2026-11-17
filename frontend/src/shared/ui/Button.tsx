import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean // mientras se envía: deshabilitado y con otro texto
}

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-red-700 text-white hover:bg-red-800',
  secundario: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
  peligro: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
}

// type="button" por defecto: en HTML un botón dentro de un form es submit, y un botón
// cualquiera («Cancelar», «+») enviaría el formulario sin querer
function Button({
  variante = 'primario',
  cargando = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
      {...props}
    >
      {cargando ? 'Procesando…' : children}
    </button>
  )
}

export default Button
