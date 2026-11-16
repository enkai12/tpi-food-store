# Carga los datos iniciales. Se corre desde backend/ con: python -m app.db.seed
# Con --solo-admin carga solo el administrador: es la base que esperan los archivos .http.
# Se puede correr varias veces: antes de crear algo, busco si ya existe y no lo toco
import sys

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.schemas import CategoriaCreate
from app.modules.productos.models import Producto
from app.modules.productos.repository import ProductoRepository
from app.modules.productos.schemas import ProductoCreate
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

# El registro público siempre crea un user: el admin solo se puede crear desde acá
ADMIN = {
    "username": "admin",
    "full_name": "Administrador del Sistema",
    "email": "admin@example.com",
    "password": "Admin1234!",
}

COMIDAS = "https://www.themealdb.com/images/media/meals/"
BEBIDAS = "https://www.thecocktaildb.com/images/media/drink/"

# Cada categoría con su descripción y sus productos: nombre, descripción, precio, stock e
# imagen. El agua va sin imagen a propósito: el catálogo tiene que verse bien sin foto
CATALOGO = [
    ("Pizzas", "A la piedra, con masa casera", [
        ("Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9000, 20,
         f"{COMIDAS}x0lk931587671540.jpg"),
    ]),
    ("Empanadas", "Al horno, de a una o por docena", [
        ("Empanada de carne", "Carne cortada a cuchillo", 1500, 60,
         f"{COMIDAS}dxpc7j1764370714.jpg"),
        ("Empanada criolla", "Carne, huevo y aceitunas", 1500, 60,
         f"{COMIDAS}q99te31763075494.jpg"),
        ("Empanada chilena", "Carne, cebolla, huevo y pasas", 1600, 40,
         f"{COMIDAS}q4xgij1782851193.jpg"),
    ]),
    ("Hamburguesas", "Todas con papas fritas", [
        ("Hamburguesa clásica", "Carne, lechuga, tomate y cheddar", 8500, 25,
         f"{COMIDAS}44bzep1761848278.jpg"),
        ("Hamburguesa doble", "Doble carne, doble cheddar y salsa especial", 11000, 20,
         f"{COMIDAS}urzj1d1587670726.jpg"),
        ("Hamburguesa de cordero", "Con salsa de yogur y pepino", 12000, 10,
         f"{COMIDAS}k420tj1585565244.jpg"),
    ]),
    ("Postres", "Caseros", [
        ("Flan con dulce de leche", "Flan casero con dulce de leche", 4000, 15,
         f"{COMIDAS}0s80wo1764374393.jpg"),
        ("Brownie", "Con frambuesas", 3500, 15, f"{COMIDAS}yypvst1511386427.jpg"),
        ("Alfajor de maicena", "Relleno de dulce de leche y coco", 1800, 30,
         f"{COMIDAS}a4kgf21763075288.jpg"),
        ("Panqueques con dulce de leche", "Dos panqueques", 4500, 12,
         f"{COMIDAS}rwuyqx1511383174.jpg"),
    ]),
    ("Bebidas", "Bien frías", [
        ("Limonada de frutilla", "Sin alcohol, 500 ml", 3000, 30,
         f"{BEBIDAS}spvvxp1468924425.jpg"),
        ("Agua mineral", "Sin gas, 500 ml", 1500, 48, None),
    ]),
]


def cargar_admin(usuarios: UsuarioRepository, mensajes: list[str]) -> None:
    if usuarios.get_by_username(ADMIN["username"]):
        mensajes.append(f"[=] Ya existe: {ADMIN['username']}")
        return
    usuarios.add(
        Usuario(
            username=ADMIN["username"],
            full_name=ADMIN["full_name"],
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            role="admin",
        )
    )
    mensajes.append(f"[+] Creado: {ADMIN['username']} / {ADMIN['password']} (rol admin)")


def cargar_catalogo(
    categorias: CategoriaRepository, productos: ProductoRepository, mensajes: list[str]
) -> None:
    for nombre, descripcion, items in CATALOGO:
        categoria = categorias.get_by_nombre(nombre)
        if categoria:
            mensajes.append(f"[=] Ya existe la categoría: {nombre}")
        else:
            # Los mismos schemas de la API: el seed no puede cargar algo que ella rechazaría
            datos = CategoriaCreate(nombre=nombre, descripcion=descripcion)
            categoria = categorias.add(Categoria.model_validate(datos))
            mensajes.append(f"[+] Categoría: {nombre}")

        for p_nombre, p_descripcion, precio, stock, imagen in items:
            if productos.get_by_nombre(p_nombre):
                mensajes.append(f"[=]   Ya existe: {p_nombre}")
                continue
            datos = ProductoCreate(
                nombre=p_nombre,
                descripcion=p_descripcion,
                precio_base=precio,
                stock=stock,
                imagen_url=imagen,
                categoria_id=categoria.id,
            )
            productos.add(Producto.model_validate(datos))
            mensajes.append(f"[+]   {p_nombre} (${precio}, stock {stock})")


def run(solo_admin: bool = False) -> None:
    create_all_tables()
    mensajes: list[str] = []
    # Todo en una transacción del Unit of Work: si algo falla, no queda nada a medias
    with UnitOfWork(session_factory) as uow:
        cargar_admin(UsuarioRepository(uow.session), mensajes)
        if not solo_admin:
            categorias = CategoriaRepository(uow.session)
            cargar_catalogo(categorias, ProductoRepository(uow.session), mensajes)
    # Recién acá se confirmó: si hubo un error, la excepción cortó antes y no se muestra
    # nada como «creado»
    print("\n".join(mensajes))


if __name__ == "__main__":
    run(solo_admin="--solo-admin" in sys.argv)
