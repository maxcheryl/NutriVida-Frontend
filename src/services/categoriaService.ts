/** Reúne las solicitudes para consultar y administrar categorías. */
import { api } from '../api/axiosConfig'
import type { Categoria } from '../types'

/** Lista las categorías disponibles en el catálogo. */
export async function listarCategorias(): Promise<Categoria[]> {
  const respuesta = await api.get<Categoria[]>('/categorias')
  return respuesta.data
}

/** Crea una categoría (solo administrador). */
export async function crearCategoria(nombre: string): Promise<Categoria> {
  const respuesta = await api.post<Categoria>('/categorias', { nombre })
  return respuesta.data
}

/** Actualiza una categoría (solo administrador). */
export async function actualizarCategoria(id: string, nombre: string): Promise<Categoria> {
  const respuesta = await api.put<Categoria>(`/categorias/${id}`, { nombre })
  return respuesta.data
}

/** Elimina una categoría (solo administrador; 409 si tiene productos). */
export async function eliminarCategoria(id: string): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
