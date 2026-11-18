// Cuenta caracteres como el backend (Python): .length cuenta unidades UTF-16 y un emoji
// vale 2, así una dirección pasaría el mínimo en el navegador y el backend la rechazaría
export const largo = (texto: string) => Array.from(texto).length
