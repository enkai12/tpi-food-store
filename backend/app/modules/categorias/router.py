from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.database import session_factory
from app.core.deps import Admin
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["categorias"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork(session_factory))


# Las dos lecturas son públicas: el catálogo se ve sin iniciar sesión
@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: Annotated[CategoriaService, Depends(get_categoria_service)]):
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead)
def obtener_categoria(
    id: Annotated[int, Path(gt=0)],
    service: Annotated[CategoriaService, Depends(get_categoria_service)],
):
    try:
        return service.obtener(id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    data: CategoriaCreate,
    _admin: Admin,
    service: Annotated[CategoriaService, Depends(get_categoria_service)],
):
    try:
        return service.crear(data)
    except NombreDuplicado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/{id}", response_model=CategoriaRead)
def actualizar_categoria(
    id: Annotated[int, Path(gt=0)],
    data: CategoriaUpdate,
    _admin: Admin,
    service: Annotated[CategoriaService, Depends(get_categoria_service)],
):
    try:
        return service.actualizar(id, data)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NombreDuplicado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# 204: la baja salió bien y la respuesta no tiene cuerpo
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(
    id: Annotated[int, Path(gt=0)],
    _admin: Admin,
    service: Annotated[CategoriaService, Depends(get_categoria_service)],
):
    try:
        service.eliminar(id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
