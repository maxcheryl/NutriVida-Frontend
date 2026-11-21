/**
 * Tipos compartidos de la aplicación: catálogo de servicios, usuarios,
 * sesión, carrito y mapas de persistencia.
 */

/** Roles que puede tener un usuario. */
export type RolUsuario = 'administrador' | 'recepcionista' | 'cliente'

/**
 * Producto/servicio del catálogo. `imagen` es la local por defecto y
 * `imagenUrl` la URL externa ingresada en los formularios (Fase 11.1).
 */
export interface Servicio {
  codigo: string
  tipo: string
  nombre: string
  duracion: string
  modalidad: string
  precio: number
  cuposIniciales: number
  descripcion: string
  imagen?: string
  imagenUrl?: string
}

/** Categoría del catálogo; los productos la referencian por nombre (`tipo`). */
export interface Categoria {
  id: string
  nombre: string
}

export type Genero = 'Mujer' | 'Hombre' | 'Otro' | 'NoDice'

/** Registro de usuario en el sistema. */
export interface Usuario {
  id: string
  nombre: string
  apellido: string
  correo: string
  fechaNacimiento: string
  contrasena: string
  genero: Genero | ''
  region: string
  direccion: string
  rol: RolUsuario
  avatar?: string
}

/** Datos del usuario en sesión activa; nunca incluye la contraseña. */
export interface Sesion {
  id: string
  nombre: string
  apellido: string
  correo: string
  genero: Genero | ''
  region: string
  rol: RolUsuario
}

/** Ítem del carrito: copia del producto + cantidad solicitada. */
export interface CarritoItem extends Servicio {
  cantidad: number
}

/** Contador de intentos fallidos de login por correo. */
export interface RegistroIntentos {
  intentos: number
  bloqueado: boolean
}

/** Mapa correo → intentos. */
export type IntentosMap = Record<string, RegistroIntentos>

/** Mapa código de producto → cupos ya reservados. */
export type ReservadosMap = Record<string, number>

// ==================== ÓRDENES (HISTORIAL DE COMPRAS/RESERVAS) ====================

/** Estados posibles de una orden. Nace RESERVADA; el admin puede cancelarla. */
export type EstadoOrden = 'RESERVADA' | 'CANCELADA'

/**
 * Línea de una orden: conserva el precio unitario al momento de la compra
 * (precio histórico), aunque el producto cambie de precio después.
 */
export interface DetalleOrden {
  id: number
  productoCodigo: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

/** Orden (compra/reserva) de un cliente. */
export interface Orden {
  id: number
  fecha: string
  total: number
  estado: EstadoOrden
  /** Nombre completo del cliente (visible en el listado administrativo). */
  cliente?: string
  /** Incluido en el detalle; el listado puede omitirlo. */
  detalles?: DetalleOrden[]
}
