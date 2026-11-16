from datetime import datetime
from typing import Annotated, Literal

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.core.validaciones import ENTERO_MAX, SinNulos, TextoOpcional

# RN-06: solo estas dos formas de pago; cualquier otro valor da 422
FormaPago = Literal["EFECTIVO", "TRANSFERENCIA"]

# Los cuatro estados de la máquina de estados (p. 5)
EstadoPedido = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]

# RN-06: de 5 a 200 caracteres, contados sin los espacios de los extremos
Direccion = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=5, max_length=200), SinNulos
]


class ItemPedidoCreate(SQLModel):
    producto_id: int = Field(gt=0, le=ENTERO_MAX)
    cantidad: int = Field(ge=1, le=ENTERO_MAX)


class PedidoCreate(SQLModel):
    # Al menos un ítem (RN-01). El máximo evita un pedido enorme: como no se repiten
    # productos, 100 alcanza de sobra para un carrito
    items: list[ItemPedidoCreate] = Field(min_length=1, max_length=100)
    forma_pago: FormaPago
    direccion_entrega: Direccion
    notas: TextoOpcional | None = None


# Cada línea con la copia del nombre y del precio que se cobraron
class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetallePedidoRead]  # se arma desde la relación Pedido.items


# Una página del listado: total es la cantidad que cumple los filtros, no solo esta página
class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


# Cuerpo del PATCH /estado: uno de los cuatro estados (la transición la valida el Service)
class CambioEstado(SQLModel):
    estado: EstadoPedido
