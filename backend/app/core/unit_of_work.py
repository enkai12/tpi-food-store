from sqlmodel import Session


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
                self.session.commit()
        finally:
            # La sesión se cierra siempre, aunque el commit falle
            self.session.close()
