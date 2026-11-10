from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Antes de atender pedidos creo las tablas que falten
    create_all_tables()
    yield


app = FastAPI(title="Food Store API", version="1.0.0", lifespan=lifespan)

# El frontend corre en otro origen y manda la cookie de sesión en cada pedido:
# por eso el origen va escrito y allow_credentials en True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Todos los endpoints quedan bajo /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")
