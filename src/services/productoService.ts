/** Reúne las solicitudes para consultar y administrar el catálogo. */
import { api } from '../api/axiosConfig'
import type { Servicio } from '../types'

export interface FiltrosProductos {
  categoria?: string
  texto?: string
}

/** Lista los servicios y aplica los filtros enviados. */
export async function listarProductos(filtros: FiltrosProductos = {}): Promise<Servicio[]> {
  const respuesta = await api.get<Servicio[]>('/productos', { params: filtros })
  return respuesta.data
}

/** Busca un servicio por su código para mostrar su detalle. */
export async function obtenerProducto(codigo: string): Promise<Servicio> {
  const respuesta = await api.get<Servicio>(`/productos/${codigo}`)
  return respuesta.data
}

/** Envía un nuevo servicio al backend. */
export async function crearProducto(datos: Partial<Servicio>): Promise<Servicio> {
  const respuesta = await api.post<Servicio>('/productos', datos)
  return respuesta.data
}

/** Envía los cambios de un servicio al backend. */
export async function actualizarProducto(codigo: string, datos: Partial<Servicio>): Promise<Servicio> {
  const respuesta = await api.put<Servicio>(`/productos/${codigo}`, datos)
  return respuesta.data
}

/** Pide al backend que desactive un servicio del catálogo. */
export async function eliminarProducto(codigo: string): Promise<void> {
  await api.delete(`/productos/${codigo}`)
}

/** Actualiza cuántos cupos quedan disponibles para reservar. */
export async function actualizarStock(codigo: string, cupos: number): Promise<Servicio> {
  const respuesta = await api.put<Servicio>(`/productos/${codigo}/stock`, { cupos })
  return respuesta.data
}
