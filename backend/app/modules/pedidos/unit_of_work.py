from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    def __enter__(self) -> "PedidoUnitOfWork":
        super().__enter__()
        # Pedidos y productos en la misma sesión: el pedido, sus líneas y el descuento de
        # stock se confirman juntos o no se confirma nada (RN-01)
        self.pedidos = PedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)
        return self
