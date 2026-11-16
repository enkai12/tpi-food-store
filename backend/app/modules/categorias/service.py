from app.core.unit_of_work import RegistroDuplicado
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


# Excepciones de dominio: el Service no sabe de HTTP, el Router las traduce a un código
class CategoriaNoEncontrada(Exception):
    def __init__(self, id: int) -> None:
        super().__init__(f"Categoría {id} no encontrada")


class NombreDuplicado(Exception):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"Ya existe una categoría con el nombre '{nombre}'")


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    # Una categoría dada de baja se trata como si no existiera
    def _obtener_activa(self, uow: CategoriaUnitOfWork, id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(id)
        return categoria

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._obtener_activa(uow, id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        try:
            with self.uow as uow:
                # Busco entre todas, también las dadas de baja: la baja no libera el nombre
                if uow.categorias.get_by_nombre(data.nombre):
                    raise NombreDuplicado(data.nombre)
                categoria = uow.categorias.add(Categoria.model_validate(data))
                return CategoriaRead.model_validate(categoria)
        except RegistroDuplicado:
            # Otra categoría con ese nombre entró entre el control y el INSERT
            raise NombreDuplicado(data.nombre)

    def actualizar(self, id: int, data: CategoriaUpdate) -> CategoriaRead:
        try:
            with self.uow as uow:
                categoria = self._obtener_activa(uow, id)
                # Solo los campos que llegaron en el cuerpo: el resto queda como estaba
                cambios = data.model_dump(exclude_unset=True)
                if "nombre" in cambios:
                    otra = uow.categorias.get_by_nombre(cambios["nombre"])
                    if otra is not None and otra.id != id:
                        raise NombreDuplicado(cambios["nombre"])
                for campo, valor in cambios.items():
                    setattr(categoria, campo, valor)
                return CategoriaRead.model_validate(categoria)
        except RegistroDuplicado:
            # El UPDATE chocó al confirmar: otra categoría tomó ese nombre a la vez
            raise NombreDuplicado(data.nombre)

    def eliminar(self, id: int) -> None:
        with self.uow as uow:
            # Baja lógica: la fila queda y sus productos no se tocan
            categoria = self._obtener_activa(uow, id)
            categoria.activo = False
