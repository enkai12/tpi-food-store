// Los roles que maneja el backend
export type Rol = 'user' | 'admin'

// Cómo se muestra cada rol: en la Navbar y en la tabla de usuarios del panel
export const NOMBRE_ROL: Record<Rol, string> = { admin: 'Administrador', user: 'Cliente' }

// Lo que devuelve el backend (UserPublic)
export interface Usuario {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string // fecha ISO con zona: JSON no tiene tipo fecha
}

// Lo que guarda el authStore: lo que muestra la interfaz. Nunca el token
export type UsuarioSesion = Pick<Usuario, 'username' | 'full_name' | 'email' | 'role'>

export interface LoginData {
  username: string
  password: string
}

export interface RegistroData {
  username: string
  full_name: string
  email: string
  password: string
}
