/** Mantiene los datos de la persona que inició sesión y las acciones de cuenta. */
import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Sesion } from '../types'
import {
  cerrarSesionBackend,
  iniciarSesion as apiIniciarSesion,
  obtenerSesion,
  registrarUsuario as apiRegistrarUsuario,
  type DatosRegistro,
} from '../services/authService'
import { actualizarPerfil as apiActualizarPerfil, obtenerPerfil } from '../services/usuarioService'
import { mensajeDeError, setAlExpirarSesion } from '../api/axiosConfig'

export interface ResultadoAuth {
  exito: boolean
  mensaje?: string
}

interface AuthContextValue {
  usuario: Sesion | null
  cargando: boolean
  iniciarSesion: (correo: string, contrasena: string) => Promise<ResultadoAuth>
  cerrarSesion: () => Promise<void>
  registrarUsuario: (datos: DatosRegistro) => Promise<ResultadoAuth>
  actualizarPerfil: (datos: any) => Promise<ResultadoAuth>
  refrescarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Sesion | null>(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Al abrir la app, pregunta al backend si hay una sesión activa.
    obtenerSesion()
      .then((sesion) => {
        setUsuario(sesion)
      })
      .catch(() => {
        setUsuario(null)
      })
      .finally(() => {
        setCargando(false)
      })

    // El interceptor avisa si el backend ya no puede renovar la sesión.
    setAlExpirarSesion(() => {
      setUsuario(null)
    })
  }, [])

  async function iniciarSesion(correoInput: string, contrasena: string): Promise<ResultadoAuth> {
    const correo = correoInput.trim().toLowerCase()
    if (!correo || !contrasena) {
      return { exito: false, mensaje: 'Debes completar todos los campos' }
    }
    try {
      const sesion = await apiIniciarSesion(correo, contrasena)
      setUsuario(sesion)
      return { exito: true }
    } catch (error) {
      return { exito: false, mensaje: mensajeDeError(error) }
    }
  }

  async function cerrarSesion() {
    try {
      await cerrarSesionBackend()
    } catch {
      // Aunque el backend no responda, cerramos la sesión localmente.
    } finally {
      setUsuario(null)
      navigate('/')
    }
  }

  async function registrarUsuario(datos: DatosRegistro): Promise<ResultadoAuth> {
    try {
      const sesion = await apiRegistrarUsuario(datos)
      setUsuario(sesion)
      return { exito: true }
    } catch (error) {
      return { exito: false, mensaje: mensajeDeError(error) }
    }
  }

  async function actualizarPerfil(datos: any): Promise<ResultadoAuth> {
    try {
      const sesion = await apiActualizarPerfil(datos)
      setUsuario(sesion)
      return { exito: true }
    } catch (error) {
      return { exito: false, mensaje: mensajeDeError(error) }
    }
  }

  async function refrescarSesion() {
    try {
      const perfil = await obtenerPerfil()
      setUsuario(perfil)
    } catch {
      // Si no se puede cargar el perfil, se conserva el estado actual.
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        cerrarSesion,
        registrarUsuario,
        actualizarPerfil,
        refrescarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
