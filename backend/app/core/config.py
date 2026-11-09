from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Los valores salen del archivo .env. Los que no tienen valor por defecto son
    # obligatorios: si faltan, la aplicación no arranca
    DATABASE_URL: str
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # extra="ignore": si el .env trae otras variables, no las uso y no corto el arranque
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Una sola instancia para toda la aplicación
settings = Settings()
