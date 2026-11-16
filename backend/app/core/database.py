from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# El engine administra las conexiones con PostgreSQL; se crea una sola vez
engine = create_engine(settings.DATABASE_URL)


def create_all_tables() -> None:
    # Importar los modelos los registra en SQLModel.metadata; sin estos imports,
    # create_all no sabe qué tablas crear. Van acá adentro para que importar
    # database.py no cargue los modelos: se cargan recién al crear las tablas
    import app.modules.categorias.models  # noqa: F401
    import app.modules.pedidos.models  # noqa: F401
    import app.modules.productos.models  # noqa: F401
    import app.modules.usuarios.models  # noqa: F401

    # Crea las tablas que todavía no existan; las que ya existen no las toca
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    # Cada Unit of Work pide acá una sesión nueva al entrar al with
    return Session(engine)
