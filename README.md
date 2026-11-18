# Food Store

Agustín Emiliano Sotelo Carmelich · Programación IV · TUPaD UTN · Trabajo Práctico Integrador

Tienda de comidas full-stack. Los clientes se registran, recorren el catálogo, arman un
carrito y confirman pedidos; el administrador gestiona categorías, productos, stock,
pedidos y usuarios desde un panel.

- **Repositorio:** https://github.com/enkai12/tpi-food-store
- **Video de la demostración:** _(pendiente: lo agrego cuando lo grabo)_

## Qué usé

- **Backend** (`backend/`): FastAPI, SQLModel y PostgreSQL, con Unit of Work, repositorios
  y JWT en una cookie httpOnly.
- **Frontend** (`frontend/`): React con TypeScript estricto, Vite, Tailwind, TanStack Query,
  Form y Table, Zustand, Axios y React Router, organizado por features.

## Requisitos

- Python 3.13
- PostgreSQL (lo probé con la 18)
- Node.js 20.19 o superior (o 22.12 en adelante) y pnpm 9 o superior

## Backend

1. Creo la base en PostgreSQL:

   ```sql
   CREATE DATABASE foodstore_db;
   ```

2. Desde `backend/`, copio `.env.example` como `.env` y completo `DATABASE_URL` con mi
   usuario y contraseña de PostgreSQL (las demás variables ya tienen un valor que sirve para
   probarlo):

   ```bash
   cd backend
   cp .env.example .env
   ```

3. Creo el entorno virtual e instalo las dependencias:

   ```bash
   python3.13 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

   En Windows, con PowerShell: `copy .env.example .env`, `py -3.13 -m venv .venv` y
   `.venv\Scripts\activate`.

4. Cargo los datos iniciales (crea las tablas, el administrador, 5 categorías y 13
   productos). Se puede correr más de una vez: lo que ya existe no se duplica.

   ```bash
   python -m app.db.seed
   ```

5. Levanto la API:

   ```bash
   uvicorn app.main:app --reload
   ```

   La documentación queda en http://localhost:8000/docs (también en `/redoc`).

## Frontend

En otra terminal, desde `frontend/`:

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

La aplicación queda en http://localhost:5173. Para generar la versión de producción:
`pnpm build`.

## Variables de entorno

| Archivo | Variable | Para qué |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | La conexión a PostgreSQL: `postgresql://usuario:clave@localhost:5432/foodstore_db` |
| | `SECRET_KEY` | La clave con la que se firma el JWT (32 caracteres o más) |
| | `ALGORITHM` | El algoritmo del JWT (`HS256`) |
| | `ACCESS_TOKEN_EXPIRE_MINUTES` | Cuánto dura la sesión (30) |
| | `FRONTEND_ORIGIN` | El origen del frontend que acepta CORS (`http://localhost:5173`) |
| `frontend/.env` | `VITE_API_URL` | La URL de la API (`http://localhost:8000/api/v1`) |

Uso siempre `localhost` y no `127.0.0.1`: para el navegador son orígenes distintos, y con
uno de cada lado CORS bloquea las respuestas y la cookie de la sesión.

## Usuario administrador

El seed crea el único administrador (el registro público siempre crea clientes):

- **Usuario:** `admin`
- **Contraseña:** `Admin1234!`

## Pruebas de la API

En `backend/http/` están los pedidos de cada módulo, para la extensión REST Client. Esperan
una base recién creada que tenga solo al administrador, así que antes la vacío (con la API
apagada), cargo solo el admin y después los corro en orden: `auth`, `usuarios`, `categorias`,
`productos` y `pedidos`.

```sql
DROP DATABASE foodstore_db;
CREATE DATABASE foodstore_db;
```

```bash
python -m app.db.seed --solo-admin
```
