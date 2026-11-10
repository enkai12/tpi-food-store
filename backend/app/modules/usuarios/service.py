from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# Excepciones de dominio: el Service no sabe de HTTP, el Router las traduce a un código
class UsuarioNoEncontrado(Exception):
    def __init__(self, id: int) -> None:
        super().__init__(f"Usuario {id} no encontrado")


class NoPuedeDesactivarse(Exception):
    def __init__(self) -> None:
        super().__init__("No podés desactivar tu propia cuenta")


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.get_all()]

    def cambiar_estado(self, id: int, disabled: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(id)
            if usuario is None:
                raise UsuarioNoEncontrado(id)
            # Baja o alta lógica: el usuario no se borra. Si ya tenía ese valor no pasa
            # nada, así que repetir el pedido da el mismo resultado
            usuario.disabled = disabled
            return UserPublic.model_validate(usuario)

    def desactivar(self, id: int, admin_id: int) -> UserPublic:
        # Si el admin se desactivara a sí mismo, podría quedar sin nadie que lo reactive
        if id == admin_id:
            raise NoPuedeDesactivarse()
        return self.cambiar_estado(id, disabled=True)
