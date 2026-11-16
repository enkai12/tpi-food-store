from datetime import datetime

from sqlalchemy import Row
from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def get_for_update(self, id: int) -> Pedido | None:
        # Como get_by_id, pero bloquea la fila hasta el commit: dos cambios de estado del mismo
        # pedido se hacen de a uno, y el segundo ve lo que dejó el primero
        return self.session.exec(select(Pedido).where(Pedido.id == id).with_for_update()).first()

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

    def count_by_estado(self, desde: datetime) -> Row:
        # Los indicadores del panel en una sola consulta, que recorre la tabla una vez.
        # count(*) FILTER (WHERE ...) cuenta solo las filas que cumplen la condición
        def contar(condicion):
            return func.count().filter(condicion)

        consulta = select(
            contar(Pedido.estado == "PENDIENTE").label("pendientes"),
            contar(Pedido.estado == "EN_PREPARACION").label("en_preparacion"),
            contar(Pedido.estado == "ENTREGADO").label("entregados"),
            contar(Pedido.estado == "CANCELADO").label("cancelados"),
            contar(Pedido.created_at >= desde).label("pedidos_hoy"),
            # Sin pedidos entregados, SUM devuelve NULL: coalesce lo pasa a 0
            func.coalesce(
                func.sum(Pedido.total).filter(Pedido.estado == "ENTREGADO"), 0
            ).label("ingresos_entregados"),
        )
        return self.session.exec(consulta).one()
