from datetime import datetime
from typing import Annotated

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel

# Saca los espacios del principio y del final antes de medir: "   " no pasa
TextoNoVacio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


# Datos del registro. No tiene role: si lo tuviera, cualquiera podría registrarse como admin
class UserCreate(SQLModel):
    username: TextoNoVacio
    full_name: TextoNoVacio
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt usa hasta 72 bytes


# Lo que ve el cliente: nunca incluye hashed_password
class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime
