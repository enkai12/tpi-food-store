from typing import TYPE_CHECKING

from sqlalchemy import Index, func
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto


class Categoria(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str  # único sin distinguir mayúsculas: ver el índice de abajo
    descripcion: str | None = None
    activo: bool = True  # baja lógica

    productos: list["Producto"] = Relationship(back_populates="categoria")


# Índice único sobre lower(nombre): «Pizzas» y «pizzas» no pueden convivir, aunque cada
# categoría conserve cómo la escribió el admin. La base decide igual que el Service
Index("uq_categoria_nombre_lower", func.lower(Categoria.nombre), unique=True)
