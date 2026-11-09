from typing import Generic, Type, TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


# Las operaciones comunes a todas las entidades. Cada módulo hereda de esta clase
# y agrega sus consultas propias. Nunca hace commit: eso lo decide el Unit of Work
class BaseRepository(Generic[T]):
    def __init__(self, session: Session, model: Type[T]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, id: int) -> T | None:
        return self.session.get(self.model, id)

    def get_all(self) -> list[T]:
        return list(self.session.exec(select(self.model)).all())

    def add(self, entity: T) -> T:
        self.session.add(entity)
        # flush manda el INSERT sin confirmarlo: así la base ya le asigna el id
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        # Borrado físico; los módulos del TPI usan baja lógica y no lo llaman
        self.session.delete(entity)
        self.session.flush()
