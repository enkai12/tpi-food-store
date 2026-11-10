from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.database import session_factory
from app.core.deps import require_role
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import (
    NoPuedeDesactivarse,
    UsuarioNoEncontrado,
    UsuarioService,
)
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["usuarios"])

# Todas las rutas de este router son solo para el admin
Admin = Annotated[UserPublic, Depends(require_role(["admin"]))]


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork(session_factory))


@router.get("", response_model=list[UserPublic])
def listar_usuarios(
    _admin: Admin, service: Annotated[UsuarioService, Depends(get_usuario_service)]
):
    return service.listar()


@router.post("/{id}/activar", response_model=UserPublic)
def activar_usuario(
    id: Annotated[int, Path(gt=0)],
    _admin: Admin,
    service: Annotated[UsuarioService, Depends(get_usuario_service)],
):
    try:
        return service.cambiar_estado(id, disabled=False)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/desactivar", response_model=UserPublic)
def desactivar_usuario(
    id: Annotated[int, Path(gt=0)],
    admin: Admin,  # lo necesito para saber cuál es la cuenta propia
    service: Annotated[UsuarioService, Depends(get_usuario_service)],
):
    try:
        return service.desactivar(id, admin.id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NoPuedeDesactivarse as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
