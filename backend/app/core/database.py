from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# El engine administra las conexiones con PostgreSQL; se crea una sola vez
engine = create_engine(settings.DATABASE_URL)


def create_all_tables() -> None:
    # Crea las tablas de los modelos que estén importados y que todavía no existan
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    # Cada Unit of Work pide acá una sesión nueva al entrar al with
    return Session(engine)
