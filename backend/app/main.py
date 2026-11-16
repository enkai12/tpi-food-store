import math
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.productos.router import router as productos_router
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


def _numero_para_json(numero: float) -> float | str:
    # NaN e Infinity no existen en JSON: si el cliente los mandó, los devuelvo como texto
    return numero if math.isfinite(numero) else str(numero)


# El mismo 422 de FastAPI, con una diferencia: el detalle repite el dato recibido, y si era
# NaN o Infinity, la respuesta no se podía escribir en JSON y terminaba en un 500
@app.exception_handler(RequestValidationError)
async def error_de_validacion(request: Request, exc: RequestValidationError) -> JSONResponse:
    detalle = jsonable_encoder(exc.errors(), custom_encoder={float: _numero_para_json})
    return JSONResponse(status_code=422, content={"detail": detalle})


# Todos los endpoints quedan bajo /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")
app.include_router(categorias_router, prefix="/api/v1")
app.include_router(productos_router, prefix="/api/v1")
