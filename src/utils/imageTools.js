// Pequeñas utilidades relacionadas a imágenes
export function getUnique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

export function sortDescNumeric(arr) {
  return [...arr].sort((a, b) => Number(b) - Number(a));
}
