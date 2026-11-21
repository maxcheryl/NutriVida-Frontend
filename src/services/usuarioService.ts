/**
 * Servicio de usuarios: gestión administrativa (CRUD), creación por
 * recepcionista y actualización del perfil del usuario autenticado.
 */
import { api } from '../api/axiosConfig'
import type { Sesion, Usuario } from '../types'

/** Lista todos los usuarios (solo administrador). */
export async function listarUsuarios(): Promise<Usuario[]> {
  const respuesta = await api.get<Usuario[]>('/usuarios')
  return respuesta.data
}

/** Crea un usuario. El backend restringe el rol según quién lo invoca. */
export async function crearUsuario(datos: Partial<Usuario>): Promise<Usuario> {
  const respuesta = await api.post<Usuario>('/usuarios', datos)
  return respuesta.data
}

/** Actualiza un usuario (solo administrador). */
export async function actualizarUsuario(id: string, datos: Partial<Usuario>): Promise<Usuario> {
  const respuesta = await api.put<Usuario>(`/usuarios/${id}`, datos)
  return respuesta.data
}

/** Desactiva/elimina un usuario (solo administrador). */
export async function eliminarUsuario(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`)
}

/** Devuelve el perfil del usuario autenticado. */
export async function obtenerPerfil(): Promise<Sesion> {
  const respuesta = await api.get<Sesion>('/perfil')
  return respuesta.data
}

/** Actualiza el perfil del usuario autenticado (sin poder cambiar su rol). */
export async function actualizarPerfil(datos: Partial<Usuario>): Promise<Sesion> {
  const respuesta = await api.put<Sesion>('/perfil', datos)
  return respuesta.data
}
