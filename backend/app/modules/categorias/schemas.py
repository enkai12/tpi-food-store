from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.core.validaciones import SinNulos, TextoOpcional

# Saca los espacios del principio y del final antes de medir: "  " no pasa
# y "  Pizzas  " se guarda como "Pizzas"
NombreCategoria = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100), SinNulos
]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: TextoOpcional | None = None


# PUT parcial: cada campo se puede omitir. nombre no lleva "| None" porque en la tabla
# es obligatorio: si no llega, queda el default sin validar; si llega null, da 422
class CategoriaUpdate(SQLModel):
    nombre: NombreCategoria = Field(default=None)
    descripcion: TextoOpcional | None = None


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    activo: bool
