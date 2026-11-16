from app.core.fechas import ahora_utc
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead, PedidosPaginados
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado


# Excepciones de dominio. El Router traduce PedidoNoEncontrado a 404, PedidoAjeno a 403 y
# las demás a 400. La de producto inexistente ya está en el módulo de productos y la reuso
class PedidoNoEncontrado(Exception):
    def __init__(self, id: int) -> None:
        super().__init__(f"Pedido {id} no encontrado")


class PedidoAjeno(Exception):
    def __init__(self) -> None:
        super().__init__("No tenés permiso para ver este pedido")


class ProductoRepetido(Exception):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"El producto {producto_id} está repetido en el pedido")


class ProductoNoDisponible(Exception):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"El producto '{nombre}' no está disponible")


class StockInsuficiente(Exception):
    def __init__(self, nombre: str, stock: int, cantidad: int) -> None:
        super().__init__(
            f"Stock insuficiente para '{nombre}': hay {stock} y se pidieron {cantidad}"
        )


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        usuario_id: int,
        es_admin: bool,
        skip: int,
        limit: int,
        estado: str | None = None,
    ) -> PedidosPaginados:
        # RN-04: el admin ve todos; un cliente, solo los suyos
        with self.uow as uow:
            total, pedidos = uow.pedidos.list_by_usuario(
                None if es_admin else usuario_id, skip, limit, estado
            )
            items = [PedidoRead.model_validate(p) for p in pedidos]
            return PedidosPaginados(total=total, items=items)

    def obtener(self, id: int, usuario_id: int, es_admin: bool) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.pedidos.get_by_id(id)
            # Primero si existe (404) y después de quién es (403), como pide la consigna
            if pedido is None:
                raise PedidoNoEncontrado(id)
            if not es_admin and pedido.usuario_id != usuario_id:
                raise PedidoAjeno()
            return PedidoRead.model_validate(pedido)

    def crear(self, data: PedidoCreate, usuario_id: int) -> PedidoRead:
        # RN-01: un producto repetido se rechaza antes de tocar la base
        ids = [item.producto_id for item in data.items]
        vistos: set[int] = set()
        for producto_id in ids:
            if producto_id in vistos:
                raise ProductoRepetido(producto_id)
            vistos.add(producto_id)

        with self.uow as uow:
            # Una sola consulta trae y bloquea todos los productos del pedido hasta el commit
            productos = {p.id: p for p in uow.productos.list_for_update(ids)}

            # El pedido nace en PENDIENTE y se arma en memoria con sus líneas; se guarda al
            # final, cuando todo es válido. Las dos fechas son el mismo instante
            ahora = ahora_utc()
            pedido = Pedido(
                usuario_id=usuario_id,
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega,
                notas=data.notas,
                total=0,
                created_at=ahora,
                updated_at=ahora,
                items=[],
            )

            # Por cada ítem, en la misma vuelta: valida, descuenta el stock y crea la línea
            # con la copia del nombre y del precio. Si algo falla, el Unit of Work deshace
            # todo, también los descuentos de los ítems anteriores
            total = 0.0
            for item in data.items:
                producto = productos.get(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(producto.nombre)
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(producto.nombre, producto.stock, item.cantidad)

                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            # round evita restos del float, como 0.30000000000000004 (H11)
            pedido.total = round(total, 2)
            # add hace el flush: INSERT del pedido y de sus líneas, y el id
            pedido = uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)
