// Las variables del .env que usa la app. Es opcional porque el .env puede no tenerla:
// axiosInstance lo controla al arrancar
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
