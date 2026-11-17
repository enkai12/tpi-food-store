import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'

interface ModalProps {
  abierto: boolean // lo maneja la página con useState
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

// Usa el <dialog> nativo con showModal(): el navegador ya resuelve lo difícil. Lo pone por
// encima de todo, deja inerte el resto de la página, mantiene el foco adentro y lo devuelve
// al botón que lo abrió. Lo abre y lo cierra siempre React (la prop abierto): Escape y el
// clic en el fondo solo avisan con onCerrar, una vez
function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const tituloId = useId()

  // React decide si está abierto; el efecto se lo aplica al elemento
  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // Escape dispara cancel: freno el cierre del navegador y aviso; cierra el efecto
  function alCancelar(e: SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault()
    onCerrar()
  }

  // Un clic en el fondo oscuro llega con el propio <dialog> como destino: el contenido está
  // en un div interno que ocupa todo el cuadro
  function alHacerClic(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onCerrar()
  }

  return (
    // En el celular deja 1 rem de cada lado: si ocupara todo el ancho, no habría fondo
    // donde tocar para cerrarlo
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onCancel={alCancelar}
      onClick={alHacerClic}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 id={tituloId} className="mb-4 text-lg font-semibold text-stone-900">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  )
}

export default Modal
