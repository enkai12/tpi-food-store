from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


# Datos del registro. No tiene role: si lo tuviera, cualquiera podría registrarse como admin
class UserCreate(SQLModel):
    username: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
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
