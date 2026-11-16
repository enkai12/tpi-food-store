from sqlalchemy.orm import joinedload
from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


def _escapar_comodines(texto: str) -> str:
    # En LIKE, % y _ son comodines: los escapo para que se busquen como texto
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def search(
        self,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, list[Producto]]:
        # Los filtros se arman una sola vez y se usan para contar y para la página,
        # así el total y los ítems no pueden filtrar distinto
        condiciones = [Producto.activo]
        texto = (search or "").strip()
        if texto:
            patron = f"%{_escapar_comodines(texto)}%"
            condiciones.append(Producto.nombre.ilike(patron, escape="\\"))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(Producto.disponible == disponible)

        # El total de lo que cumple los filtros, no solo de esta página
        total = self.session.exec(
            select(func.count()).select_from(Producto).where(*condiciones)
        ).one()

        # joinedload trae la categoría con un JOIN en la misma consulta: cada producto
        # tiene una sola categoría, así que el JOIN no repite filas
        pagina = (
            select(Producto)
            .where(*condiciones)
            .options(joinedload(Producto.categoria))
            .order_by(Producto.id)
            .offset(skip)
            .limit(limit)
        )
        return total, list(self.session.exec(pagina).all())
