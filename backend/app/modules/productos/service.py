from app.modules.categorias.models import Categoria
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


# Excepción de dominio: el Router la traduce a 404. La de categoría inexistente
# ya está en el módulo de categorías y la reuso
class ProductoNoEncontrado(Exception):
    def __init__(self, id: int) -> None:
        super().__init__(f"Producto {id} no encontrado")


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    # Un producto dado de baja se trata como si no existiera
    def _obtener_activo(self, uow: ProductoUnitOfWork, id: int) -> Producto:
        producto = uow.productos.get_by_id(id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado(id)
        return producto

    # Controlo la categoría antes de guardar: si no, la FK fallaría con un 500
    def _validar_categoria(self, uow: ProductoUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(categoria_id)
        return categoria

    def obtener(self, id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._obtener_activo(uow, id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_categoria(uow, data.categoria_id)
            producto = uow.productos.add(Producto.model_validate(data))
            return ProductoRead.model_validate(producto)

    def actualizar(self, id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, id)
            cambios = data.model_dump(exclude_unset=True)
            # La categoría se controla solo si cambia: un producto cuya categoría se dio
            # de baja se puede seguir editando sin moverlo de categoría
            if "categoria_id" in cambios and cambios["categoria_id"] != producto.categoria_id:
                producto.categoria = self._validar_categoria(uow, cambios["categoria_id"])
            for campo, valor in cambios.items():
                setattr(producto, campo, valor)
            return ProductoRead.model_validate(producto)

    def cambiar_stock(self, id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, id)
            producto.stock = data.stock
            producto.disponible = data.disponible
            return ProductoRead.model_validate(producto)

    def eliminar(self, id: int) -> None:
        with self.uow as uow:
            # Baja lógica: la fila queda, y los pedidos que la nombran siguen igual
            producto = self._obtener_activo(uow, id)
            producto.activo = False
