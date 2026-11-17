import { useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

// Igual que Input, para un <select> nativo: label unido, error anunciado. Lo usan el filtro
// del catálogo y, en el panel, la categoría de un producto
function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const generado = useId()
  const selectId = id ?? generado
  const errorId = `${selectId}-error`
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-stone-900 focus:outline-2 focus:outline-red-700 ${error ? 'border-red-500' : 'border-stone-300'}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
