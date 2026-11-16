from app.core.fechas import ahora_utc
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado


# Excepciones de dominio: el Router las traduce a 400. La de producto inexistente ya
# está en el módulo de productos y la reuso (404)
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
