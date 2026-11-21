/**
 * Servicio de autenticación: registro, inicio/cierre de sesión, restauración
 * y renovación del JWT (cookie httpOnly gestionada por el backend).
 */
import { api } from '../api/axiosConfig'
import type { Sesion } from '../types'

export interface DatosRegistro {
  nombre: string
  apellido: string
  correo: string
  fechaNacimiento: string
  contrasena: string
  genero: string
  region: string
  direccion: string
}

/** Registra un usuario público con rol cliente. Devuelve la sesión creada. */
export async function registrarUsuario(datos: DatosRegistro): Promise<Sesion> {
  const respuesta = await api.post<Sesion>('/auth/registro', datos)
  return respuesta.data
}

/** Valida credenciales en el backend y recibe la cookie de sesión. */
export async function iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
  const respuesta = await api.post<Sesion>('/auth/login', { correo, contrasena })
  return respuesta.data
}

/** Cierra la sesión en el backend (borra las cookies JWT). */
export async function cerrarSesionBackend(): Promise<void> {
  await api.post('/auth/logout')
}

/** Devuelve el usuario de la sesión actual según la cookie JWT (null si no hay). */
export async function obtenerSesion(): Promise<Sesion | null> {
  try {
    const respuesta = await api.get<Sesion>('/auth/me')
    return respuesta.data
  } catch {
    return null
  }
}
