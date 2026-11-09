from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def __enter__(self) -> "UsuarioUnitOfWork":
        # Primero la clase base abre la sesión; después creo el repositorio sobre ella
        super().__enter__()
        self.usuarios = UsuarioRepository(self.session)
        return self
