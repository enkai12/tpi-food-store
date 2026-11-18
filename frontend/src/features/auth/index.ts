// La API pública de la feature auth: lo que usan las rutas, el store y la Navbar.
// Adentro de la feature se importa directo de cada archivo, nunca de acá (U10 A02).
// authApi va primero: el store la importa desde acá, y así se carga antes que las páginas,
// que a su vez importan el store
export * as authApi from './api/auth'
export { NOMBRE_ROL } from './types/auth'
export type { Rol, Usuario, UsuarioSesion } from './types/auth'
export { default as LoginPage } from './pages/LoginPage'
export { default as RegisterPage } from './pages/RegisterPage'
export { default as UnauthorizedPage } from './pages/UnauthorizedPage'
