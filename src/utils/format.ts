/** Formatea pesos chilenos: 35000 → "$35.000". */
export function formatPrecio(precio: number): string {
  return '$' + precio.toLocaleString('es-CL')
}

/**
 * Formatea el identificador de una orden a un código comercial legible (ej. 1 → "ORD-0001").
 */
export function formatearCodigoOrden(id: number, prefijo = 'ORD'): string {
  if (!id || id < 0) return `${prefijo}-0000`
  return `${prefijo}-${String(id).padStart(4, '0')}`
}

