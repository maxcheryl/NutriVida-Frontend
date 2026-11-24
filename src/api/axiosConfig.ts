/**
 * Cliente HTTP centralizado: instancia única de Axios contra la API de NutriVida.
 * - `withCredentials` envía la cookie httpOnly del JWT en cada petición.
 * - Ante un 401 intenta renovar la sesión (`/auth/refresh`) y reintenta una vez;
 *   si la renovación falla, avisa a la capa de autenticación para cerrar sesión.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

type ConfigReintento = InternalAxiosRequestConfig & { _reintento?: boolean }

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
  withCredentials: true,
})

/** Se registra desde AuthContext: se invoca cuando la sesión ya no puede renovarse. */
let alExpirarSesion: (() => void) | null = null

export function setAlExpirarSesion(handler: () => void): void {
  alExpirarSesion = handler
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined
    const url = config?.url ?? ''
    // login/registro/logout/refresh no deben disparar un refresh en cadena
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

/**
 * Extrae un mensaje legible del error para mostrarlo al usuario.
 * Prioriza el mensaje que devuelve el backend (`mensaje` o `error`).
 */
export function mensajeDeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensaje?: string; error?: string } | undefined
    const mensaje = data?.mensaje ?? data?.error
    if (mensaje) return mensaje
    if (error.response) return `Error del servidor (${error.response.status})`
    if (error.code === 'ECONNABORTED') return 'La petición tardó demasiado. Intenta nuevamente.'
    return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'
  }
  return 'Ocurrió un error inesperado.'
}
