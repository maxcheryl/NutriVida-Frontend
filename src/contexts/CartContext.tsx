/** Mantiene el carrito en memoria mientras la aplicación está abierta y confirma reservas. */
import { createContext, useContext, useState } from 'react'
import type { CarritoItem, Orden, Servicio } from '../types'
import { crearOrden } from '../services/ordenService'
import { mensajeDeError } from '../api/axiosConfig'

export interface ResultadoConfirmacion {
  exito: boolean
  mensaje?: string
  orden?: Orden
}

interface CartContextValue {
  carrito: CarritoItem[]
  totalUnidades: number
  cupoDisponible: (codigo: string, cuposBase?: number) => number
  agregarAlCarrito: (servicio: Servicio) => void
  reducirCantidad: (codigo: string) => void
  eliminarDelCarrito: (codigo: string) => void
  vaciarCarrito: () => void
  confirmarReserva: () => Promise<ResultadoConfirmacion>
  sincronizar: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([])

  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0)

  /** Resta del total disponible los servicios que ya están en el carrito. */
  function cupoDisponible(codigo: string, cuposBase?: number): number {
    const enCarrito = carrito.find((i) => i.codigo === codigo)?.cantidad ?? 0
    const base =
      cuposBase !== undefined
        ? cuposBase
        : (carrito.find((i) => i.codigo === codigo)?.cuposIniciales ?? 0)
    return Math.max(0, base - enCarrito)
  }

  function agregarAlCarrito(servicio: Servicio) {
    setCarrito((prev) => {
      const index = prev.findIndex((i) => i.codigo === servicio.codigo)
      if (index >= 0) {
        const itemActual = prev[index]
        // No permite reservar más unidades que los cupos disponibles.
        if (itemActual.cantidad >= servicio.cuposIniciales) {
          return prev
        }
        const copia = [...prev]
        copia[index] = { ...itemActual, cantidad: itemActual.cantidad + 1 }
        return copia
      }
      return [...prev, { ...servicio, cantidad: 1 }]
    })
  }

  function reducirCantidad(codigo: string) {
    setCarrito((prev) => {
      const index = prev.findIndex((i) => i.codigo === codigo)
      if (index === -1) return prev
      const itemActual = prev[index]
      // Al reducir la última unidad, se quita el servicio del carrito.
      if (itemActual.cantidad <= 1) {
        return prev.filter((i) => i.codigo !== codigo)
      }
      const copia = [...prev]
      copia[index] = { ...itemActual, cantidad: itemActual.cantidad - 1 }
      return copia
    })
  }

  function eliminarDelCarrito(codigo: string) {
    setCarrito((prev) => prev.filter((i) => i.codigo !== codigo))
  }

  function vaciarCarrito() {
    setCarrito([])
  }

  /** Envía la reserva al backend y vacía el carrito solo si se guardó correctamente. */
  async function confirmarReserva(): Promise<ResultadoConfirmacion> {
    if (carrito.length === 0) {
      return { exito: false, mensaje: 'El carrito está vacío' }
    }
    try {
      const items = carrito.map((item) => ({
        codigo: item.codigo,
        cantidad: item.cantidad,
      }))
      const orden = await crearOrden(items)
      vaciarCarrito()
      return { exito: true, orden }
    } catch (error) {
      return { exito: false, mensaje: mensajeDeError(error) }
    }
  }

  function sincronizar() {
    // El carrito no necesita recargarse porque solo se guarda en memoria.
  }

  return (
    <CartContext.Provider
      value={{
        carrito,
        totalUnidades,
        cupoDisponible,
        agregarAlCarrito,
        reducirCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
        confirmarReserva,
        sincronizar,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
