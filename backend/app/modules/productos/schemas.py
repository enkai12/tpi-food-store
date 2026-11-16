from typing import Annotated

from pydantic import FiniteFloat, StringConstraints
from sqlmodel import Field, SQLModel

from app.core.validaciones import ENTERO_MAX, SinNulos, TextoOpcional
from app.modules.categorias.schemas import CategoriaRead

# Saca los espacios del principio y del final antes de medir: "   " no pasa
NombreProducto = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100), SinNulos
]

# FiniteFloat rechaza NaN e Infinity, que JSON acepta pero no son precios: guardados,
# romperían cada respuesta que incluya el producto


class ProductoCreate(SQLModel):
    nombre: NombreProducto
    descripcion: TextoOpcional | None = None
    precio_base: FiniteFloat = Field(ge=0)
    imagen_url: TextoOpcional | None = None
    stock: int = Field(default=0, ge=0, le=ENTERO_MAX)
    disponible: bool = True
    categoria_id: int = Field(gt=0)


# PUT parcial, como en categorías: los campos obligatorios no llevan "| None", así que
# si no llegan quedan afuera del cambio y si llegan en null dan 422
class ProductoUpdate(SQLModel):
    nombre: NombreProducto = Field(default=None)
    descripcion: TextoOpcional | None = None
    precio_base: FiniteFloat = Field(default=None, ge=0)
    imagen_url: TextoOpcional | None = None
    stock: int = Field(default=None, ge=0, le=ENTERO_MAX)
    disponible: bool = Field(default=None)
    categoria_id: int = Field(default=None, gt=0)


# Cambio de stock: los dos campos son obligatorios (H31)
class ProductoStockUpdate(SQLModel):
    stock: int = Field(ge=0, le=ENTERO_MAX)
    disponible: bool


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    precio_base: float
    imagen_url: str | None
    stock: int
    disponible: bool
    activo: bool
    categoria_id: int
    categoria: CategoriaRead  # se arma desde la relación Producto.categoria


# Una página del listado: total es la cantidad que cumple los filtros, no solo esta página
class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
