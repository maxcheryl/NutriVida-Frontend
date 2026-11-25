/** Reúne las solicitudes de registro e inicio y cierre de sesión. */
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

/** Crea una cuenta de cliente y devuelve los datos de la sesión iniciada. */
export async function registrarUsuario(datos: DatosRegistro): Promise<Sesion> {
  const respuesta = await api.post<Sesion>('/auth/registro', datos)
  return respuesta.data
}

/** Envía las credenciales al backend para iniciar sesión. */
export async function iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
  const respuesta = await api.post<Sesion>('/auth/login', { correo, contrasena })
  return respuesta.data
}

/** Pide al backend que cierre la sesión y borre sus cookies. */
export async function cerrarSesionBackend(): Promise<void> {
  await api.post('/auth/logout')
}

/** Busca la sesión activa; devuelve null si no hay una sesión válida. */
export async function obtenerSesion(): Promise<Sesion | null> {
  try {
    const respuesta = await api.get<Sesion>('/auth/me')
    return respuesta.data
  } catch {
    return null
  }
}
