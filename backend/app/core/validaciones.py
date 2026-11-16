from typing import Annotated

from pydantic import AfterValidator, StringConstraints

# El máximo de una columna integer de PostgreSQL: un número mayor la desborda y la base
# respondería con un error 500. Con este límite en el schema, el cliente recibe un 422
ENTERO_MAX = 2_147_483_647


def _sin_nulos(texto: str | None) -> str | None:
    # PostgreSQL no admite el carácter nulo (\x00) dentro de un texto. None pasa: es un
    # campo opcional que no llegó
    if texto is not None and "\x00" in texto:
        raise ValueError("El texto no puede contener el carácter nulo")
    return texto


# Se agrega a cualquier texto que llegue del cliente y vaya a la base
SinNulos = AfterValidator(_sin_nulos)

# Texto libre y opcional, como una descripción o una URL
TextoOpcional = Annotated[str, StringConstraints(max_length=500), SinNulos]
