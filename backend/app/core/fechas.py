from datetime import date, datetime, time, timezone

from sqlalchemy import DateTime

# Columna con zona horaria (timestamptz): PostgreSQL guarda el instante exacto y lo
# devuelve con su zona, sin depender de cómo esté configurada cada máquina
ConZona = DateTime(timezone=True)


def ahora_utc() -> datetime:
    # El instante actual en UTC, con la zona incluida
    return datetime.now(timezone.utc)


def inicio_de_hoy() -> datetime:
    # Las 00:00 de hoy en la zona de la máquina del servidor, con la zona incluida. Comparado
    # contra una columna con zona, cuenta lo de hoy para el negocio, no para UTC
    # astimezone sobre la medianoche usa la diferencia horaria de ese momento, aunque
    # entre la medianoche y ahora haya habido un cambio de horario
    return datetime.combine(date.today(), time()).astimezone()
