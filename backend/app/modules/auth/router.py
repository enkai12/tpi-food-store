from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.database import session_factory
from app.core.deps import get_current_active_user
from app.modules.auth.schemas import Mensaje
from app.modules.auth.service import (
    AuthService,
    CredencialesInvalidas,
    CuentaDesactivada,
    UsuarioDuplicado,
)
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork(session_factory))


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def registrar(data: UserCreate, service: Annotated[AuthService, Depends(get_auth_service)]):
    try:
        return service.registrar(data)
    except UsuarioDuplicado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


# OAuth2 Password Flow: username y password llegan como formulario, no como JSON
@router.post("/token", response_model=Mensaje)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        token = service.autenticar(form_data.username, form_data.password)
    except CredencialesInvalidas as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except CuentaDesactivada as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # El token va solo en la cookie HttpOnly: JavaScript no la puede leer
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # igual que la expiración del JWT
        samesite="lax",
        secure=False,  # con HTTPS en producción iría en True
    )
    return Mensaje(message="Login exitoso")


@router.post("/logout", response_model=Mensaje)
def logout(response: Response):
    # Borra la cookie del navegador. El JWT no se revoca: una copia seguiría valiendo
    # hasta su vencimiento, por eso dura poco (30 minutos)
    response.delete_cookie(key="access_token", httponly=True, samesite="lax", secure=False)
    return Mensaje(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(current_user: Annotated[UserPublic, Depends(get_current_active_user)]):
    return current_user
