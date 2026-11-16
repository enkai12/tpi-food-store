from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        # Sin distinguir mayúsculas, igual que el índice único de la tabla
        consulta = select(Categoria).where(func.lower(Categoria.nombre) == nombre.lower())
        return self.session.exec(consulta).first()

    def list_activas(self) -> list[Categoria]:
        consulta = select(Categoria).where(Categoria.activo).order_by(Categoria.id)
        return list(self.session.exec(consulta).all())
