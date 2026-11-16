from psycopg2.errorcodes import UNIQUE_VIOLATION
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session


# La base rechazó un valor que tiene que ser único. Pasa cuando dos pedidos iguales llegan
# a la vez: los dos pasan el control del Service y el segundo INSERT choca con el UNIQUE.
# El Service la traduce a su propia excepción (409) sin conocer SQLAlchemy
class RegistroDuplicado(Exception):
    pass


def _es_duplicado(error: BaseException | None) -> bool:
    # Solo la violación de unicidad (código 23505 de PostgreSQL); cualquier otro error de
    # integridad es un error del programa y tiene que seguir siendo un 500
    return isinstance(error, IntegrityError) and getattr(error.orig, "pgcode", None) == UNIQUE_VIOLATION


class UnitOfWork:
    # Recibe la función que crea sesiones; la sesión se abre recién al entrar al with
    def __init__(self, session_factory) -> None:
        self.session_factory = session_factory

    def __enter__(self) -> "UnitOfWork":
        # Todo lo que pase dentro del with usa esta sesión: es una sola transacción
        self.session: Session = self.session_factory()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        # Si hubo una excepción deshago todo; si no, confirmo. La excepción sigue
        # su camino hacia el Router, porque este método no devuelve True
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                try:
                    self.session.commit()
                except IntegrityError as error:
                    # El duplicado puede aparecer recién al confirmar (por ejemplo, un UPDATE)
                    self.session.rollback()
                    if _es_duplicado(error):
                        raise RegistroDuplicado() from error
                    raise
        finally:
            # La sesión se cierra siempre, aunque el commit falle
            self.session.close()
        # O dentro del bloque, en el flush de un INSERT
        if _es_duplicado(exc_val):
            raise RegistroDuplicado() from exc_val
