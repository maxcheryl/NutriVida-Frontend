/** Comprueba los permisos de la sesión antes de mostrar funciones restringidas. */
import type { Sesion } from '../types'

export function esAdmin(usuario: Sesion | null): boolean {
  return usuario?.rol === 'administrador'
}

export function esRecepcionista(usuario: Sesion | null): boolean {
  return usuario?.rol === 'recepcionista'
}

/** Comprueba si la persona puede actualizar los cupos de los servicios. */
export function puedeGestionarStock(usuario: Sesion | null): boolean {
  return esAdmin(usuario) || esRecepcionista(usuario)
}
