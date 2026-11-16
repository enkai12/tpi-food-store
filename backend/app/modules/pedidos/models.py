from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.core.fechas import ConZona, ahora_utc

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Índice en la FK: «mis pedidos» filtra por usuario
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado: str = "PENDIENTE"
    forma_pago: str  # "EFECTIVO" o "TRANSFERENCIA"
    direccion_entrega: str
    notas: str | None = None
    total: float  # suma de los subtotales; no cambia después de crear el pedido
    created_at: datetime = Field(default_factory=ahora_utc, sa_type=ConZona)
    updated_at: datetime = Field(default_factory=ahora_utc, sa_type=ConZona)

    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(back_populates="pedido")


# Cada línea guarda una copia del nombre y del precio del producto al momento de la
# compra: si el producto cambia después, el pedido sigue igual
class DetallePedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Índices en las FK: las líneas se buscan por pedido y por producto
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    cantidad: int
    nombre_producto: str
    precio_unitario: float
    subtotal: float

    pedido: Optional[Pedido] = Relationship(back_populates="items")
    producto: Optional["Producto"] = Relationship(back_populates="detalles")
