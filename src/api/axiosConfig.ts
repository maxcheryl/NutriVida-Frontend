/**
 * Envía las solicitudes al backend e incluye las cookies de sesión.
 * Si la sesión venció, intenta renovarla una vez y luego repite la solicitud.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

type ConfigReintento = InternalAxiosRequestConfig & { _reintento?: boolean }

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
  withCredentials: true,
})

/** Permite avisar al contexto de autenticación cuando la sesión ya venció. */
let alExpirarSesion: (() => void) | null = null

export function setAlExpirarSesion(handler: () => void): void {
  alExpirarSesion = handler
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined
    const url = config?.url ?? ''
    // Estas rutas no deben volver a iniciar el proceso de renovación.
    const sinRefresh = [
      '/auth/login',
      '/auth/registro',
      '/auth/logout',
      '/auth/refresh',
    ].some((ruta) => url.includes(ruta))
    if (error.response?.status === 401 && config && !config._reintento && !sinRefresh) {
      config._reintento = true
      try {
        await api.post('/auth/refresh')
        return api(config)
      } catch {
        alExpirarSesion?.()
      }
    }
    return Promise.reject(error)
  },
)

/** Devuelve un mensaje sencillo para mostrar cuando una solicitud falla. */
export function mensajeDeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Primero muestra el mensaje concreto que envió el backend.
    const data = error.response?.data as { mensaje?: string; error?: string } | undefined
    const mensaje = data?.mensaje ?? data?.error
    if (mensaje) return mensaje
    if (error.response) return `Error del servidor (${error.response.status})`
    if (error.code === 'ECONNABORTED') return 'La petición tardó demasiado. Intenta nuevamente.'
    return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'
  }
  return 'Ocurrió un error inesperado.'
}
