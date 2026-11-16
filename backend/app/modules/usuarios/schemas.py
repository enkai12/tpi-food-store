from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, EmailStr, StringConstraints, field_validator
from sqlmodel import Field, SQLModel

from app.core.validaciones import SinNulos

# Saca los espacios del principio y del final antes de medir: "   " no pasa
TextoNoVacio = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100), SinNulos
]

# El usuario y el email se guardan en minúsculas: «Maria» y «maria» son la misma cuenta,
# y el UNIQUE de la base deja de distinguir mayúsculas
Username = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=50, to_lower=True),
    SinNulos,
]
Email = Annotated[EmailStr, AfterValidator(str.lower)]


# Datos del registro. No tiene role: si lo tuviera, cualquiera podría registrarse como admin
class UserCreate(SQLModel):
    username: Username
    full_name: TextoNoVacio
    email: Email
    password: Annotated[str, SinNulos] = Field(min_length=8)  # bcrypt no admite el nulo

    # bcrypt usa solo los primeros 72 bytes, y max_length cuenta caracteres: una «ñ» ocupa
    # 2 bytes. Mido los bytes para que nunca se descarte parte de la contraseña
    @field_validator("password")
    @classmethod
    def maximo_72_bytes(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar los 72 bytes")
        return password


# Lo que ve el cliente: nunca incluye hashed_password
class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime
