import { useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string // el mensaje de validación del campo, si lo hay
}

// El label queda unido al input (htmlFor + id) y el error, anunciado: un lector de pantalla
// dice «Contraseña, inválido, mínimo 8 caracteres». useId da un id único aunque el mismo
// formulario aparezca dos veces en la pantalla
function Input({ label, error, id, className = '', ...props }: InputProps) {
  const generado = useId()
  const inputId = id ?? generado
  const errorId = `${inputId}-error`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm text-stone-900 focus:outline-2 focus:outline-red-700 ${error ? 'border-red-500' : 'border-stone-300'}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
