from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.database import session_factory
from app.core.deps import Admin, UsuarioActivo
from app.core.validaciones import ENTERO_MAX
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoCancelable,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoDisponible,
    ProductoRepetido,
    StockInsuficiente,
    TransicionInvalida,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork(session_factory))


# Cualquier usuario con sesión puede comprar, también el admin. El pedido queda a nombre
# del usuario de la sesión: el cuerpo no trae usuario_id, así nadie compra por otro
@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    data: PedidoCreate,
    usuario: UsuarioActivo,
    service: Annotated[PedidoService, Depends(get_pedido_service)],
):
    try:
        return service.crear(data, usuario.id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ProductoRepetido, ProductoNoDisponible, StockInsuficiente) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# RN-04: un cliente ve sus pedidos; el admin, los de todos. estado es uno de los cuatro
# estados: cualquier otro valor da 422
@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    usuario: UsuarioActivo,
    service: Annotated[PedidoService, Depends(get_pedido_service)],
    skip: Annotated[int, Query(ge=0, le=ENTERO_MAX)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoPedido | None = None,
):
    return service.listar(usuario.id, usuario.role == "admin", skip, limit, estado)


# Detalle con sus líneas: el dueño o el admin. /pedidos/resumen (paso 14) va antes que esta
# ruta, porque si no FastAPI intentaría leer «resumen» como un id
@router.get("/{id}", response_model=PedidoRead)
def obtener_pedido(
    id: Annotated[int, Path(gt=0)],
    usuario: UsuarioActivo,
    service: Annotated[PedidoService, Depends(get_pedido_service)],
):
    try:
        return service.obtener(id, usuario.id, usuario.role == "admin")
    except PedidoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PedidoAjeno as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# El admin avanza o cancela según la máquina de estados (RN-02, RN-03)
@router.patch("/{id}/estado", response_model=PedidoRead)
def cambiar_estado(
    id: Annotated[int, Path(gt=0)],
    data: CambioEstado,
    _admin: Admin,
    service: Annotated[PedidoService, Depends(get_pedido_service)],
):
    try:
        return service.cambiar_estado(id, data.estado)
    except PedidoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except TransicionInvalida as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# El dueño cancela su pedido en PENDIENTE (RN-03, RN-04). Acceso «Dueño»: un pedido ajeno da
# 403 también al admin, que cancela los ajenos con PATCH /estado (H13)
@router.patch("/{id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(
    id: Annotated[int, Path(gt=0)],
    usuario: UsuarioActivo,
    service: Annotated[PedidoService, Depends(get_pedido_service)],
):
    try:
        return service.cancelar(id, usuario.id)
    except PedidoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PedidoAjeno as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except PedidoNoCancelable as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
