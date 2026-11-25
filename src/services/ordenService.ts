/** Reúne las solicitudes para crear y consultar reservas. */
import { api } from '../api/axiosConfig'
import type { Orden } from '../types'

export interface ItemOrden {
  codigo: string
  cantidad: number
}

/** Envía los servicios del carrito para crear una reserva. */
export async function crearOrden(items: ItemOrden[]): Promise<Orden> {
  const respuesta = await api.post<Orden>('/ordenes', { items })
  return respuesta.data
}

/** Lista las reservas de la persona que inició sesión. */
export async function listarMisOrdenes(): Promise<Orden[]> {
  const respuesta = await api.get<Orden[]>('/ordenes/mias')
  return respuesta.data
}

/** Lista todas las reservas para el panel de gestión. */
export async function listarTodasOrdenes(): Promise<Orden[]> {
  const respuesta = await api.get<Orden[]>('/ordenes')
  return respuesta.data
}

/** Cancela una reserva y pide al backend que devuelva sus cupos. */
export async function cancelarOrden(id: number): Promise<Orden> {
  const respuesta = await api.put<Orden>(`/ordenes/${id}/cancelar`)
  return respuesta.data
}
