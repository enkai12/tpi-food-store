import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCategorias } from '@/features/categorias'
import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Paginacion from '@/shared/components/Paginacion'
import Skeleton from '@/shared/components/Skeleton'
import { useDebounce } from '@/shared/hooks/useDebounce'
import Button from '@/shared/ui/Button'
import Input from '@/shared/ui/Input'
import Select from '@/shared/ui/Select'
import { leerEntero } from '@/shared/utils/url'
import ProductoCard from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 12

function CatalogoPage() {
  // Los filtros viven en la URL (?pagina=2&q=empanada&categoria=2): una recarga, «Atrás» o
  // un enlace compartido muestran lo mismo
  const [params, setParams] = useSearchParams()
  const pagina = leerEntero(params.get('pagina')) ?? 1
  const categoriaId = leerEntero(params.get('categoria'))
  const q = params.get('q') ?? ''
  const busqueda = q.trim() // lo que se busca sale siempre de la URL

  // El campo tiene su propio estado, que responde al instante. Si su valor saliera de la URL,
  // escribiendo rápido se perderían letras: React Router aplica cada cambio de URL en una
  // transition, y entre letra y letra el campo se volvería a dibujar con el valor viejo
  const [texto, setTexto] = useState(q)
  // A la URL pasa recién cuando se deja de escribir: un pedido por búsqueda, no por letra
  const textoDiferido = useDebounce(texto)

  // Cambia algunos parámetros y deja los demás. Un valor vacío lo saca de la URL.
  // useCallback: el efecto de abajo la usa, y así no es una función nueva en cada render
  const actualizar = useCallback(
    (cambios: Record<string, string | undefined>, reemplazar = false) => {
      setParams(
        (actuales) => {
          const nuevos = new URLSearchParams(actuales)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor) nuevos.set(clave, valor)
            else nuevos.delete(clave)
          }
          return nuevos
        },
        // Al escribir reemplazo la entrada del historial: «Atrás» no recorre letra por letra
        { replace: reemplazar },
      )
    },
    [setParams],
  )

  // Si la URL cambia desde afuera («Atrás», «Ver todos los productos»), el campo se pone al
  // día. Se ajusta durante el render, como recomienda React, sin otro efecto. Si q es lo
  // mismo que acabo de escribir yo, no lo toco: la persona puede haber seguido escribiendo
  const [qAnterior, setQAnterior] = useState(q)
  if (q !== qAnterior) {
    setQAnterior(q)
    if (q !== textoDiferido) setTexto(q)
  }

  // Lleva lo escrito a la URL. El efecto también corre cuando cambia q, pero solo actúa si
  // cambió lo escrito: si no, «Atrás» volvería a poner la búsqueda anterior
  const ultimoEscrito = useRef(textoDiferido)
  useEffect(() => {
    if (textoDiferido === ultimoEscrito.current) return
    ultimoEscrito.current = textoDiferido
    // Al buscar, vuelve a la primera página
    if (textoDiferido !== q) actualizar({ q: textoDiferido || undefined, pagina: undefined }, true)
  }, [textoDiferido, q, actualizar])

  const productos = useProductos({
    skip: (pagina - 1) * POR_PAGINA, // la consigna: skip = página × limit, con la primera en 0
    limit: POR_PAGINA,
    search: busqueda || undefined,
    categoria_id: categoriaId,
  })
  const categorias = useCategorias()

  function cambiarPagina(nueva: number) {
    actualizar({ pagina: nueva > 1 ? String(nueva) : undefined })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hayFiltros = Boolean(busqueda || categoriaId)
  const totalPaginas = productos.data ? Math.ceil(productos.data.total / POR_PAGINA) : 0

  function contenido() {
    if (productos.isPending) {
      return <Skeleton cantidad={6} alto="h-72" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
    }
    if (productos.isError) {
      return (
        <EstadoError
          mensaje={handleApiError(productos.error, 'No se pudo cargar el catálogo')}
          onReintentar={() => productos.refetch()}
        />
      )
    }
    const { total, items } = productos.data
    if (items.length === 0) {
      // Hay productos, pero no en esta página (por ejemplo, ?pagina=99 escrito a mano)
      if (total > 0) {
        return (
          <EstadoVacio mensaje="Esta página no existe.">
            <Button variante="secundario" onClick={() => cambiarPagina(1)}>
              Ir a la primera página
            </Button>
          </EstadoVacio>
        )
      }
      if (hayFiltros) {
        return (
          <EstadoVacio mensaje="No hay productos que coincidan con la búsqueda.">
            <Button variante="secundario" onClick={() => actualizar({ q: undefined, categoria: undefined, pagina: undefined })}>
              Ver todos los productos
            </Button>
          </EstadoVacio>
        )
      }
      return <EstadoVacio mensaje="Todavía no hay productos en el catálogo." />
    }
    return (
      <>
        <p className="mb-3 text-sm text-stone-600" aria-live="polite">
          {total === 1 ? '1 producto' : `${total} productos`}
        </p>
        {/* Mientras llega otra página, la actual queda atenuada (isPlaceholderData) */}
        <ul
          aria-busy={productos.isPlaceholderData || undefined}
          className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {items.map((producto) => (
            <li key={producto.id}>
              <ProductoCard producto={producto} />
            </li>
          ))}
        </ul>
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={cambiarPagina} />
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Catálogo</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Input
          label="Buscar"
          type="search"
          placeholder="Por ejemplo, empanada"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Select
          label="Categoría"
          value={categoriaId ?? ''}
          onChange={(e) => actualizar({ categoria: e.target.value, pagina: undefined })}
        >
          <option value="">Todas</option>
          {categorias.data?.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Select>
      </div>
      {contenido()}
    </div>
  )
}

export default CatalogoPage
