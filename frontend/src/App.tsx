import { useEffect } from 'react'
import AppRouter from '@/routes/AppRouter'
import { useAuthStore } from '@/store/authStore'

function App() {
  const checkSession = useAuthStore((s) => s.checkSession)

  // Al abrir o recargar la app, el backend confirma si la cookie sigue valiendo (/auth/me)
  useEffect(() => {
    checkSession()
  }, [checkSession])

  return <AppRouter />
}

export default App
