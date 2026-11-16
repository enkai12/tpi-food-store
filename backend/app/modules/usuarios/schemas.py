from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, EmailStr, StringConstraints
from sqlmodel import Field, SQLModel

# Saca los espacios del principio y del final antes de medir: "   " no pasa
TextoNoVacio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]

# El usuario y el email se guardan en minúsculas: «Maria» y «maria» son la misma cuenta,
# y el UNIQUE de la base deja de distinguir mayúsculas
Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, to_lower=True)]
Email = Annotated[EmailStr, AfterValidator(str.lower)]


# Datos del registro. No tiene role: si lo tuviera, cualquiera podría registrarse como admin
class UserCreate(SQLModel):
    username: Username
    full_name: TextoNoVacio
    email: Email
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
