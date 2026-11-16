from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.repository import ProductoRepository


class ProductoUnitOfWork(UnitOfWork):
    def __enter__(self) -> "ProductoUnitOfWork":
        super().__enter__()
        # Los dos repositorios comparten la sesión: la categoría se valida en la misma
        # transacción en la que se crea o se edita el producto
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
        return self
