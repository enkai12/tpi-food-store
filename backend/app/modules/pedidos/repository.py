from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: int | None,
        skip: int,
        limit: int,
        estado: str | None = None,
    ) -> tuple[int, list[Pedido]]:
        # usuario_id en None trae los pedidos de todos (lo usa el admin)
        condiciones = []
        if usuario_id is not None:
            condiciones.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            condiciones.append(Pedido.estado == estado)

        total = self.session.exec(
            select(func.count()).select_from(Pedido).where(*condiciones)
        ).one()

        # Del más nuevo al más viejo. Las líneas se traen con selectinload, en una consulta
        # aparte para toda la página: con un JOIN, cada pedido vendría repetido una vez por
        # cada línea, y habría que envolver el LIMIT en una subconsulta y quitar repetidos
        pagina = (
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))
            .order_by(Pedido.id.desc())
            .offset(skip)
            .limit(limit)
        )
        return total, list(self.session.exec(pagina).all())
