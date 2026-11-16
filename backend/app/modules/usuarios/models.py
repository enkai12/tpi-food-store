from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.core.fechas import ConZona, ahora_utc

if TYPE_CHECKING:
    from app.modules.pedidos.models import Pedido


class Usuario(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str  # el hash bcrypt, nunca la contraseña
    role: str = "user"  # "user" o "admin"
    disabled: bool = False  # baja lógica del usuario
    created_at: datetime = Field(default_factory=ahora_utc, sa_type=ConZona)

    pedidos: list["Pedido"] = Relationship(back_populates="usuario")
