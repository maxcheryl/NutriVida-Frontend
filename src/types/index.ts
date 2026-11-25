/** Tipos de datos que comparten las páginas y servicios de la aplicación. */

/** Roles que puede tener un usuario. */
export type RolUsuario = 'administrador' | 'recepcionista' | 'cliente'

/** Datos de un servicio que llega desde el catálogo del backend. */
export interface Servicio {
  codigo: string
  tipo: string
  nombre: string
  duracion: string
  modalidad: string
  precio: number
  cuposIniciales: number
  descripcion: string
  imagenUrl?: string
}

/** Categoría a la que pertenece un servicio. */
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

/** Servicio elegido para el carrito y la cantidad que se reservará. */
export interface CarritoItem extends Servicio {
  cantidad: number
}

// ==================== ÓRDENES (HISTORIAL DE COMPRAS/RESERVAS) ====================

/** Una reserva puede estar activa o cancelada. */
export type EstadoOrden = 'RESERVADA' | 'CANCELADA'

/** Servicio incluido en una reserva, con su cantidad y precio guardado. */
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
