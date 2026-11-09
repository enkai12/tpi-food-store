from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# OAuth2PasswordBearer busca el token en el encabezado Authorization. Lo cambio para que
# lo lea solo de la cookie HttpOnly: para mandarlo por encabezado, el frontend tendría
# que poder leer el token, y la cookie existe justamente para que no pueda
class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No autenticado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


# 1) Valida el token y busca al usuario en la base (401 si algo falla)
def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserPublic:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None or payload.get("sub") is None:
        raise credenciales_invalidas
    with UsuarioUnitOfWork(session_factory) as uow:
        usuario = uow.usuarios.get_by_username(payload["sub"])
        if usuario is None:
            raise credenciales_invalidas
        return UserPublic.model_validate(usuario)


# 2) La cuenta pudo desactivarse después de emitir el token: lo controlo en cada pedido
def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada"
        )
    return current_user


# 3) Devuelve una dependencia que deja pasar solo a los roles de la lista (403)
def require_role(allowed_roles: list[str]):
    def role_checker(
        current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Rol actual: '{current_user.role}'. "
                f"Se requiere uno de: {allowed_roles}",
            )
        return current_user

    return role_checker
