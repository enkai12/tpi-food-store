from app.core.security import create_access_token, hash_password, verify_password
from app.core.unit_of_work import RegistroDuplicado
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# Excepciones de dominio: el Service no sabe de HTTP, el Router las traduce a un código
class UsuarioDuplicado(Exception):
    pass


class CredencialesInvalidas(Exception):
    def __init__(self) -> None:
        super().__init__("Credenciales incorrectas")


class CuentaDesactivada(Exception):
    def __init__(self) -> None:
        super().__init__("Cuenta de usuario desactivada")


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        try:
            with self.uow as uow:
                if uow.usuarios.get_by_username(data.username):
                    raise UsuarioDuplicado("El nombre de usuario ya está en uso")
                if uow.usuarios.get_by_email(data.email):
                    raise UsuarioDuplicado("El email ya está registrado")
                usuario = uow.usuarios.add(
                    Usuario(
                        username=data.username,
                        full_name=data.full_name,
                        email=data.email,
                        hashed_password=hash_password(data.password),
                        role="user",  # el registro público siempre crea un user
                    )
                )
                return UserPublic.model_validate(usuario)
        except RegistroDuplicado:
            # Otro registro igual entró entre el control de arriba y el INSERT
            raise UsuarioDuplicado("El nombre de usuario o el email ya están en uso")

    def autenticar(self, username: str, password: str) -> str:
        with self.uow as uow:
            # El formulario del login no pasa por UserCreate: normalizo igual que el registro
            usuario = uow.usuarios.get_by_username(username.strip().lower())
            # Mismo error si no existe el usuario o si la contraseña no coincide:
            # así no se puede averiguar qué nombres de usuario existen
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise CredencialesInvalidas()
            # La cuenta desactivada se informa recién con la contraseña correcta
            if usuario.disabled:
                raise CuentaDesactivada()
            return create_access_token({"sub": usuario.username, "role": usuario.role})
