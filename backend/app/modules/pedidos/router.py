from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import session_factory
from app.core.deps import UsuarioActivo
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead
from app.modules.pedidos.service import (
    PedidoService,
    ProductoNoDisponible,
    ProductoRepetido,
    StockInsuficiente,
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
