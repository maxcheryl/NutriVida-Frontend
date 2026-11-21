/**
 * Servicio de órdenes (compras/reservas): confirmación del carrito,
 * historial del cliente y gestión administrativa.
 */
import { api } from '../api/axiosConfig'
import type { Orden } from '../types'

export interface ItemOrden {
  codigo: string
  cantidad: number
}

/** Confirma el carrito: crea la orden RESERVADA y descuenta cupos en el backend. */
export async function crearOrden(items: ItemOrden[]): Promise<Orden> {
  const respuesta = await api.post<Orden>('/ordenes', { items })
  return respuesta.data
}

/** Historial de órdenes del cliente autenticado. */
export async function listarMisOrdenes(): Promise<Orden[]> {
  const respuesta = await api.get<Orden[]>('/ordenes/mias')
  return respuesta.data
}

/** Detalle de una orden con sus productos, cantidades y precios históricos. */
export async function obtenerOrden(id: number): Promise<Orden> {
  const respuesta = await api.get<Orden>(`/ordenes/${id}`)
  return respuesta.data
}

/** Listado general de órdenes (solo administrador). */
export async function listarTodasOrdenes(): Promise<Orden[]> {
  const respuesta = await api.get<Orden[]>('/ordenes')
  return respuesta.data
}

/** Cancela una orden y devuelve los cupos (solo administrador). */
export async function cancelarOrden(id: number): Promise<Orden> {
  const respuesta = await api.put<Orden>(`/ordenes/${id}/cancelar`)
  return respuesta.data
}
