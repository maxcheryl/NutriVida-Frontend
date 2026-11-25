/** Reglas compartidas para validar contraseñas, correos y fechas de nacimiento. */
import { DOMINIO_CORREO } from '../constants'

/** Comprueba que la contraseña tenga 8 caracteres, mayúscula, minúscula y número. */
export function validarContrasena(contrasena: string): boolean {
  return (
    /.{8,}/.test(contrasena) &&
    /[A-Z]/.test(contrasena) &&
    /[a-z]/.test(contrasena) &&
    /[0-9]/.test(contrasena)
  )
}

/** Comprueba que el correo use el dominio de Duoc UC. */
export function esDominioDuoc(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith(DOMINIO_CORREO)
}

/** Calcula la edad en años para validar los límites permitidos. */
export function calcularEdad(fechaNacimiento: string): number {
  const fechaActual = new Date()
  const fechaIngresada = new Date(fechaNacimiento)
  // El año de 365,25 días considera el efecto de los años bisiestos.
  return (fechaActual.getTime() - fechaIngresada.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}
