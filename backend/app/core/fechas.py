from datetime import datetime, timezone

from sqlalchemy import DateTime

# Columna con zona horaria (timestamptz): PostgreSQL guarda el instante exacto y lo
# devuelve con su zona, sin depender de cómo esté configurada cada máquina
ConZona = DateTime(timezone=True)


def ahora_utc() -> datetime:
    # El instante actual en UTC, con la zona incluida
    return datetime.now(timezone.utc)
