import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Producto } from '@/features/productos'

// Lo que se guarda de cada producto: los cuatro campos de la consigna y el stock, para no
// dejar pedir más de lo que hay (el backend igual lo controla: RN-01)
export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  stock: number
}

interface CartState {
  items: ItemCarrito[]
  agregar: (producto: Producto) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  actualizarDatos: (producto: Producto) => void
  total: () => number
  cantidadTotal: () => number
}

// Redondeo a centavos: 0.1 + 0.2 da 0.30000000000000004 en JavaScript
const redondear = (valor: number) => Math.round(valor * 100) / 100

export const subtotal = (item: ItemCarrito) => redondear(item.precio_unitario * item.cantidad)

// Entre 1 y el stock que se conoce
const acotar = (cantidad: number, stock: number) => Math.max(1, Math.min(cantidad, stock))

// El total y la cantidad se calculan a partir de los ítems, no se guardan: así nunca quedan
// desparejos con la lista
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Si ya está, suma uno (hasta el stock). Un producto que no se puede pedir no entra
      agregar: (producto) => {
        if (!producto.disponible || producto.stock <= 0) return
        const existente = get().items.find((i) => i.producto_id === producto.id)
        if (existente) {
          get().cambiarCantidad(producto.id, existente.cantidad + 1)
          return
        }
        const nuevo: ItemCarrito = {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio_unitario: producto.precio_base,
          cantidad: 1,
          stock: producto.stock,
        }
        set({ items: [...get().items, nuevo] })
      },

      quitar: (productoId) => set({ items: get().items.filter((i) => i.producto_id !== productoId) }),

      cambiarCantidad: (productoId, cantidad) =>
        set({
          items: get().items.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad: acotar(cantidad, i.stock) } : i,
          ),
        }),

      vaciar: () => set({ items: [] }),

      // El carrito puede tener días: con los datos actuales del producto, actualizo el nombre,
      // el precio y el stock. La cantidad no la toco: si supera el stock, la pantalla avisa
      actualizarDatos: (producto) => {
        const item = get().items.find((i) => i.producto_id === producto.id)
        if (
          !item ||
          (item.nombre === producto.nombre &&
            item.precio_unitario === producto.precio_base &&
            item.stock === producto.stock)
        ) {
          return // nada que cambiar: no vuelvo a escribir el store
        }
        set({
          items: get().items.map((i) =>
            i.producto_id === producto.id
              ? { ...i, nombre: producto.nombre, precio_unitario: producto.precio_base, stock: producto.stock }
              : i,
          ),
        })
      },

      total: () => redondear(get().items.reduce((suma, item) => suma + subtotal(item), 0)),
      cantidadTotal: () => get().items.reduce((suma, item) => suma + item.cantidad, 0),
    }),
    {
      // Sin storage: persist usa localStorage, que sobrevive a cerrar el navegador (H22). Es
      // público: se puede armar sin sesión y no se vacía al cerrarla
      name: 'food-store-carrito',
      partialize: (state) => ({ items: state.items }), // solo los datos, no las funciones
    },
  ),
)

// Dos pestañas abiertas: cuando una cambia el carrito, la otra lo vuelve a leer. El evento
// storage llega solo a las OTRAS pestañas del mismo sitio
window.addEventListener('storage', (evento) => {
  if (evento.key === 'food-store-carrito') useCartStore.persist.rehydrate()
})
