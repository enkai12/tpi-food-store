from sqlmodel import SQLModel


# Respuesta del login y del logout: el token nunca va en el cuerpo, solo en la cookie
class Mensaje(SQLModel):
    message: str
