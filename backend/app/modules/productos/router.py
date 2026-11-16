from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.database import session_factory
from app.core.deps import Admin
from app.core.validaciones import ENTERO_MAX, SinNulos
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoNoEncontrado, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork

router = APIRouter(prefix="/productos", tags=["productos"])


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork(session_factory))


# El listado y el detalle son públicos: el catálogo se ve sin iniciar sesión.
# Query valida los parámetros antes de tocar la base: fuera de rango da 422
@router.get("", response_model=ProductosPaginados)
def listar_productos(
    service: Annotated[ProductoService, Depends(get_producto_service)],
    skip: Annotated[int, Query(ge=0, le=ENTERO_MAX)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=100), SinNulos] = None,
    categoria_id: Annotated[int | None, Query(gt=0)] = None,
    disponible: bool | None = None,
):
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{id}", response_model=ProductoRead)
def obtener_producto(
    id: Annotated[int, Path(gt=0)],
    service: Annotated[ProductoService, Depends(get_producto_service)],
):
    try:
        return service.obtener(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(
    data: ProductoCreate,
    _admin: Admin,
    service: Annotated[ProductoService, Depends(get_producto_service)],
):
    try:
        return service.crear(data)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{id}", response_model=ProductoRead)
def actualizar_producto(
    id: Annotated[int, Path(gt=0)],
    data: ProductoUpdate,
    _admin: Admin,
    service: Annotated[ProductoService, Depends(get_producto_service)],
):
    try:
        return service.actualizar(id, data)
    except (ProductoNoEncontrado, CategoriaNoEncontrada) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{id}/stock", response_model=ProductoRead)
def cambiar_stock(
    id: Annotated[int, Path(gt=0)],
    data: ProductoStockUpdate,
    _admin: Admin,
    service: Annotated[ProductoService, Depends(get_producto_service)],
):
    try:
        return service.cambiar_stock(id, data)
    except ProductoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# 204: la baja salió bien y la respuesta no tiene cuerpo
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    id: Annotated[int, Path(gt=0)],
    _admin: Admin,
    service: Annotated[ProductoService, Depends(get_producto_service)],
):
    try:
        service.eliminar(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
