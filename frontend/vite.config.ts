import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El alias @/ se declara una sola vez, en los paths de tsconfig.app.json: Vite 8 los lee
  // de ahí. Sin esto, tsc -b y el build andan, pero pnpm dev no resuelve los imports
  resolve: { tsconfigPaths: true },
})
