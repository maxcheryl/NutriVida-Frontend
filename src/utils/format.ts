/** Muestra un precio en pesos chilenos, por ejemplo $35.000. */
export function formatPrecio(precio: number): string {
  return '$' + precio.toLocaleString('es-CL')
}

/** Añade ceros al id para mostrar un código de reserva, por ejemplo ORD-0001. */
export function formatearCodigoOrden(id: number, prefijo = 'ORD'): string {
  if (!id || id < 0) return `${prefijo}-0000`
  return `${prefijo}-${String(id).padStart(4, '0')}`
}

