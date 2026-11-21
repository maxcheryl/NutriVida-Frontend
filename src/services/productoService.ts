/**
 * Servicio de productos (catálogo de servicios): consultas públicas
 * y administración (crear, editar, eliminar, actualizar stock).
 */
import { api } from '../api/axiosConfig'
import type { Servicio } from '../types'

export interface FiltrosProductos {
  categoria?: string
  texto?: string
}

/** Lista productos; permite filtrar por nombre de categoría y texto de búsqueda. */
export async function listarProductos(filtros: FiltrosProductos = {}): Promise<Servicio[]> {
  const respuesta = await api.get<Servicio[]>('/productos', { params: filtros })
  return respuesta.data
}

/** Busca un producto por su código (detalle). */
export async function obtenerProducto(codigo: string): Promise<Servicio> {
  const respuesta = await api.get<Servicio>(`/productos/${codigo}`)
  return respuesta.data
}

/** Crea un producto (solo administrador). */
export async function crearProducto(datos: Partial<Servicio>): Promise<Servicio> {
  const respuesta = await api.post<Servicio>('/productos', datos)
  return respuesta.data
}

/** Actualiza un producto (solo administrador). */
export async function actualizarProducto(codigo: string, datos: Partial<Servicio>): Promise<Servicio> {
  const respuesta = await api.put<Servicio>(`/productos/${codigo}`, datos)
  return respuesta.data
}

/** Elimina/desactiva un producto (solo administrador). */
export async function eliminarProducto(codigo: string): Promise<void> {
  await api.delete(`/productos/${codigo}`)
}

/** Reemplaza los cupos disponibles de un producto (administrador o recepcionista). */
export async function actualizarStock(codigo: string, cupos: number): Promise<Servicio> {
  const respuesta = await api.put<Servicio>(`/productos/${codigo}/stock`, { cupos })
  return respuesta.data
}
