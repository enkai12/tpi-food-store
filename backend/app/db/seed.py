# Carga los datos iniciales. Se corre desde backend/ con: python -m app.db.seed
# Se puede correr varias veces: antes de crear algo, busco si ya existe
from sqlmodel import select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.usuarios.models import Usuario

# El registro público siempre crea un user: el admin solo se puede crear desde acá
ADMIN = {
    "username": "admin",
    "full_name": "Administrador del Sistema",
    "email": "admin@example.com",
    "password": "Admin1234!",
}


def run() -> None:
    create_all_tables()

    with session_factory() as session:
        existente = session.exec(
            select(Usuario).where(Usuario.username == ADMIN["username"])
        ).first()
        if existente:
            print(f"[=] Ya existe: {ADMIN['username']}")
        else:
            session.add(
                Usuario(
                    username=ADMIN["username"],
                    full_name=ADMIN["full_name"],
                    email=ADMIN["email"],
                    hashed_password=hash_password(ADMIN["password"]),
                    role="admin",
                )
            )
            print(f"[+] Creado: {ADMIN['username']} / {ADMIN['password']} (rol admin)")

        # El seed no pasa por el Unit of Work, así que confirmo a mano
        session.commit()


if __name__ == "__main__":
    run()
