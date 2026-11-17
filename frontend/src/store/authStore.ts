import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { authApi, type Usuario, type UsuarioSesion } from '@/features/auth'
import { setUnauthorizedHandler } from '@/shared/api/axiosInstance'
import { queryClient } from '@/shared/api/queryClient'

interface AuthState {
  usuario: UsuarioSesion | null
  cargando: boolean // true mientras /auth/me confirma la sesión al abrir la app
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiarSesion: () => void
}

// Me quedo solo con lo que muestra la interfaz (el backend también manda id, disabled y la
// fecha de alta)
function aSesion({ username, full_name, email, role }: Usuario): UsuarioSesion {
  return { username, full_name, email, role }
}

// create<AuthState>()(...) con dos pares de paréntesis: así TypeScript tipa bien el store
// cuando lo envuelvo con persist
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: true,

      // Si falla, el error sigue hasta el formulario (useMutation), que muestra el mensaje
      login: async (username, password) => {
        await authApi.login(username, password) // el backend deja la cookie
        const usuario = await authApi.me() // y con la cookie pido mis datos
        set({ usuario: aSesion(usuario), cargando: false })
      },

      logout: async () => {
        try {
          await authApi.logout() // el backend borra la cookie
        } catch {
          // Aunque falle, limpio igual: si la cookie quedó, vence sola y el próximo 401 cierra
        }
        get().limpiarSesion()
      },

      // Al abrir la app, lo guardado puede estar viejo (la cookie venció o desactivaron la
      // cuenta): el backend confirma si la sesión sigue
      checkSession: async () => {
        try {
          const usuario = await authApi.me()
          set({ usuario: aSesion(usuario), cargando: false })
        } catch (error) {
          if (axios.isAxiosError(error) && !error.response) {
            // Sin respuesta (backend caído o sin red) no sé si la sesión sigue: dejo lo
            // guardado, y si venció, el primer 401 la cierra
            set({ cargando: false })
          } else {
            // 401 sin sesión o 400 cuenta desactivada
            get().limpiarSesion()
          }
        }
      },

      // La usan logout, checkSession y el interceptor
      limpiarSesion: () => {
        const habiaSesion = get().usuario !== null
        set({ usuario: null, cargando: false })
        // Si había una cuenta, borro sus datos de la caché de TanStack Query (por ejemplo, sus
        // pedidos), para que la próxima persona no los vea. resetQueries y no clear: clear
        // cancela los pedidos en curso, y una pantalla que sigue montada (el catálogo) se
        // quedaría cargando para siempre; reset deja la caché vacía y vuelve a pedir lo que
        // está en pantalla. Sin sesión previa no hay nada que borrar
        if (habiaSesion) queryClient.resetQueries()
      },
    }),
    {
      name: 'food-store-sesion', // la clave en sessionStorage
      storage: createJSONStorage(() => sessionStorage), // se borra al cerrar la pestaña (H22)
      // Guardo solo el usuario, nunca el token (está en la cookie HttpOnly). cargando no:
      // al recargar tiene que volver a esperar a /auth/me
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// Cuando el interceptor de Axios detecta que la sesión terminó, la limpio acá
setUnauthorizedHandler(() => useAuthStore.getState().limpiarSesion())
