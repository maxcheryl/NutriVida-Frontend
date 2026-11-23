/**
 * Panel de administración (solo admin): CRUD de usuarios, productos y
 * categorías, con validaciones completas, modales de confirmación y
 * protección de la cuenta propia.
 */
import { useEffect, useState, type FormEvent } from 'react'
import {
  EDAD_MAXIMA,
  IMAGEN_DEFECTO,
  OPCIONES_GENERO,
  OPCIONES_ROL,
  PRECIO_MAXIMO,
  PRECIO_MINIMO,
  STOCK_MAXIMO,
} from '../constants'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../services/usuarioService'
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../services/productoService'
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../services/categoriaService'
import {
  listarTodasOrdenes,
  cancelarOrden,
} from '../services/ordenService'
import { mensajeDeError } from '../api/axiosConfig'
import type { Categoria, Genero, RolUsuario, Servicio, Usuario, Orden } from '../types'
import AppModal from '../ui/AppModal'
import PasswordInput from '../ui/PasswordInput'
import StockBadge from '../ui/StockBadge'
import { formatPrecio, formatearCodigoOrden } from '../utils/format'
import { validarContrasena, esDominioDuoc, calcularEdad } from '../utils/validators'

type Pestana = 'usuarios' | 'productos' | 'categorias' | 'ordenes'

const USUARIO_VACIO: Omit<Usuario, 'id'> = {
  nombre: '',
  apellido: '',
  correo: '',
  fechaNacimiento: '',
  contrasena: '',
  genero: '',
  region: '',
  direccion: '',
  rol: 'cliente',
}

const PRODUCTO_VACIO: Omit<Servicio, 'codigo'> = {
  tipo: '',
  nombre: '',
  duracion: '',
  modalidad: 'Presencial',
  precio: 0,
  cuposIniciales: 0,
  descripcion: '',
  imagenUrl: '',
}

export default function PanelAdministracionPage() {
  const { showToast } = useToast()
  const { usuario, refrescarSesion } = useAuth()
  const { sincronizar } = useCart()
  const [pestana, setPestana] = useState<Pestana>('usuarios')
  const hoy = new Date().toISOString().split('T')[0]
  const fechaMinima = new Date()
  fechaMinima.setFullYear(fechaMinima.getFullYear() - EDAD_MAXIMA)
  const minFecha = fechaMinima.toISOString().split('T')[0]

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [productos, setProductos] = useState<Servicio[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null)
  const [modalDetalleOrden, setModalDetalleOrden] = useState(false)
  const [filtroEstadoOrden, setFiltroEstadoOrden] = useState<'TODAS' | 'RESERVADA' | 'CANCELADA'>('TODAS')
  const [busquedaOrden, setBusquedaOrden] = useState('')

  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [formUsuario, setFormUsuario] = useState(USUARIO_VACIO)
  const [modalPropiaCuentaAbierto, setModalPropiaCuentaAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState<{
    mensaje: string
    onConfirmar: () => void
  } | null>(null)

  const [modalProductoAbierto, setModalProductoAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Servicio | null>(null)
  const [formProducto, setFormProducto] = useState(PRODUCTO_VACIO)

  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [nombreCategoria, setNombreCategoria] = useState('')

  const [errorForm, setErrorForm] = useState<string | null>(null)

  async function refrescar() {
    try {
      const [u, p, c, o] = await Promise.all([
        listarUsuarios(),
        listarProductos(),
        listarCategorias(),
        listarTodasOrdenes(),
      ])
      setUsuarios(u)
      setProductos(p)
      setCategorias(c)
      setOrdenes(o)
    } catch (err) {
      showToast(mensajeDeError(err), 'danger')
    }
  }

  useEffect(() => {
    refrescar()
  }, [])

  // ==================== USUARIOS ====================
  function abrirNuevoUsuario() {
    setUsuarioEditando(null)
    setFormUsuario(USUARIO_VACIO)
    setErrorForm(null)
    setModalUsuarioAbierto(true)
  }

  function abrirEditarUsuario(u: Usuario) {
    setUsuarioEditando(u)
    setFormUsuario({
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo,
      fechaNacimiento: u.fechaNacimiento,
      contrasena: u.contrasena,
      genero: u.genero,
      region: u.region,
      direccion: u.direccion,
      rol: u.rol,
    })
    setErrorForm(null)
    setModalUsuarioAbierto(true)
  }

  async function guardarUsuario(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    if (
      !formUsuario.nombre.trim() ||
      !formUsuario.apellido.trim() ||
      !formUsuario.correo.trim() ||
      !formUsuario.contrasena.trim() ||
      !formUsuario.fechaNacimiento ||
      !formUsuario.genero ||
      !formUsuario.region.trim() ||
      !formUsuario.direccion.trim()
    ) {
      setErrorForm('Todos los campos son obligatorios')
      return
    }
    if (!esDominioDuoc(formUsuario.correo.trim())) {
      setErrorForm('El correo debe ser del dominio @duocuc.cl')
      return
    }
    if (!validarContrasena(formUsuario.contrasena)) {
      setErrorForm('La contraseña debe contener 8 carácteres, una mayúscula, una minúscula y un número')
      return
    }
    if (formUsuario.fechaNacimiento > hoy) {
      setErrorForm('La fecha de nacimiento no puede ser posterior al día de hoy')
      return
    }
    if (calcularEdad(formUsuario.fechaNacimiento) < 14) {
      setErrorForm('El usuario es solo para personas mayores a 14 años')
      return
    }
    if (calcularEdad(formUsuario.fechaNacimiento) > EDAD_MAXIMA) {
      setErrorForm(`La edad máxima permitida es de ${EDAD_MAXIMA} años`)
      return
    }

    const editandoCuentaPropia = Boolean(usuarioEditando && esUsuarioActual(usuarioEditando.correo))

    try {
      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, {
          ...formUsuario,
          rol: editandoCuentaPropia && usuario ? usuario.rol : formUsuario.rol,
          correo: formUsuario.correo.trim().toLowerCase(),
        })
        if (editandoCuentaPropia) refrescarSesion()
        showToast('Usuario actualizado correctamente', 'success')
      } else {
        await crearUsuario({
          ...formUsuario,
          correo: formUsuario.correo.trim().toLowerCase(),
        })
        showToast('Usuario creado correctamente', 'success')
      }
      setModalUsuarioAbierto(false)
      refrescar()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    }
  }

  function esUsuarioActual(correo: string): boolean {
    return Boolean(usuario && correo.toLowerCase() === usuario.correo.toLowerCase())
  }

  function pedirConfirmacion(mensaje: string, onConfirmar: () => void) {
    setConfirmacion({ mensaje, onConfirmar })
  }

  function manejarEliminarUsuario(id: string, correo: string) {
    if (esUsuarioActual(correo)) {
      setModalPropiaCuentaAbierto(true)
      return
    }
    pedirConfirmacion(`¿Eliminar al usuario ${correo}?`, async () => {
      try {
        await eliminarUsuario(id)
        showToast('Usuario eliminado', 'warning')
        refrescar()
      } catch (err) {
        showToast(mensajeDeError(err), 'danger')
      }
    })
  }

  // ==================== PRODUCTOS ====================
  function abrirNuevoProducto() {
    setProductoEditando(null)
    setFormProducto({ ...PRODUCTO_VACIO, tipo: categorias[0]?.nombre ?? '' })
    setErrorForm(null)
    setModalProductoAbierto(true)
  }

  function abrirEditarProducto(p: Servicio) {
    setProductoEditando(p)
    setFormProducto({
      tipo: p.tipo,
      nombre: p.nombre,
      duracion: p.duracion,
      modalidad: p.modalidad,
      precio: p.precio,
      cuposIniciales: Math.max(0, p.cuposIniciales),
      descripcion: p.descripcion,
      imagenUrl: p.imagenUrl ?? '',
    })
    setErrorForm(null)
    setModalProductoAbierto(true)
  }

  async function guardarProducto(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    if (!formProducto.nombre.trim() || !formProducto.tipo) {
      setErrorForm('Completa los campos obligatorios (nombre y categoría)')
      return
    }

    if (
      !Number.isInteger(formProducto.precio) ||
      formProducto.precio < PRECIO_MINIMO ||
      formProducto.precio > PRECIO_MAXIMO
    ) {
      setErrorForm(
        `El precio debe ser un número entero entre ${formatPrecio(PRECIO_MINIMO)} y ${formatPrecio(PRECIO_MAXIMO)}`,
      )
      return
    }

    if (
      !Number.isInteger(formProducto.cuposIniciales) ||
      formProducto.cuposIniciales < 0 ||
      formProducto.cuposIniciales > STOCK_MAXIMO
    ) {
      setErrorForm(`El stock debe ser un número entero entre 0 y ${STOCK_MAXIMO}`)
      return
    }

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando.codigo, {
          ...formProducto,
          codigo: productoEditando.codigo,
        })
        showToast('Producto actualizado correctamente', 'success')
      } else {
        const prefijo = formProducto.tipo.slice(0, 2).toUpperCase()
        const codigo = `${prefijo}${Date.now().toString().slice(-4)}`
        await crearProducto({
          codigo,
          ...formProducto,
          imagenUrl: formProducto.imagenUrl || undefined,
        })
        showToast('Producto creado correctamente', 'success')
      }
      setModalProductoAbierto(false)
      refrescar()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    }
  }

  function manejarEliminarProducto(codigo: string) {
    pedirConfirmacion(`¿Eliminar el producto ${codigo}?`, async () => {
      try {
        await eliminarProducto(codigo)
        sincronizar()
        showToast('Producto eliminado', 'warning')
        refrescar()
      } catch (err) {
        showToast(mensajeDeError(err), 'danger')
      }
    })
  }

  // ==================== CATEGORÍAS ====================
  function abrirNuevaCategoria() {
    setCategoriaEditando(null)
    setNombreCategoria('')
    setErrorForm(null)
    setModalCategoriaAbierto(true)
  }

  function abrirEditarCategoria(c: Categoria) {
    setCategoriaEditando(c)
    setNombreCategoria(c.nombre)
    setErrorForm(null)
    setModalCategoriaAbierto(true)
  }

  async function guardarCategoria(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    if (!nombreCategoria.trim()) {
      setErrorForm('El nombre es obligatorio')
      return
    }

    const duplicada = categorias.some(
      (c) => c.nombre.toLowerCase() === nombreCategoria.trim().toLowerCase() && c.id !== categoriaEditando?.id
    )
    if (duplicada) {
      setErrorForm('Ya existe una categoría con ese nombre')
      return
    }

    try {
      if (categoriaEditando) {
        await actualizarCategoria(categoriaEditando.id, nombreCategoria.trim())
        showToast('Categoría actualizada', 'success')
      } else {
        await crearCategoria(nombreCategoria.trim())
        showToast('Categoría creada', 'success')
      }
      setModalCategoriaAbierto(false)
      refrescar()
    } catch (err) {
      setErrorForm(mensajeDeError(err))
    }
  }

  function manejarEliminarCategoria(id: string) {
    const cat = categorias.find((c) => c.id === id)
    if (!cat) return
    pedirConfirmacion(`¿Eliminar la categoría "${cat.nombre}"?`, async () => {
      try {
        await eliminarCategoria(id)
        showToast('Categoría eliminada', 'warning')
        refrescar()
      } catch (err) {
        showToast(mensajeDeError(err), 'danger')
      }
    })
  }

  // ==================== ÓRDENES Y RESERVAS GLOBALES ====================
  function formatearFecha(isoString: string): string {
    try {
      const fecha = new Date(isoString)
      return fecha.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  function manejarCancelarOrden(orden: Orden) {
    const codigo = formatearCodigoOrden(orden.id)
    pedirConfirmacion(
      `¿Estás seguro de cancelar la orden ${codigo} del cliente "${orden.cliente || 'Desconocido'}"? Se devolverán los cupos automáticamente a la base de datos.`,
      async () => {
        try {
          await cancelarOrden(orden.id)
          sincronizar()
          showToast(`Orden ${codigo} cancelada exitosamente`, 'warning')
          refrescar()
        } catch (err) {
          showToast(mensajeDeError(err), 'danger')
        }
      },
    )
  }

  function verDetalleOrden(o: Orden) {
    setOrdenDetalle(o)
    setModalDetalleOrden(true)
  }

  const ordenesFiltradas = ordenes.filter((o) => {
    const coincideEstado = filtroEstadoOrden === 'TODAS' || o.estado === filtroEstadoOrden
    const texto = busquedaOrden.trim().toLowerCase()
    const codigo = formatearCodigoOrden(o.id).toLowerCase()
    const cliente = (o.cliente ?? '').toLowerCase()
    const coincideBusqueda = !texto || codigo.includes(texto) || cliente.includes(texto)
    return coincideEstado && coincideBusqueda
  })

  return (
    <main className="pt-5">
      <section className="py-5 mt-2">
        <div className="container-fluid px-3 px-md-4">
          <div className="mb-4">
            <h1 className="section-title text-start mb-1">Panel de Administración</h1>
            <p className="text-muted mb-0">Gestiona usuarios, productos y categorías de la tienda</p>
          </div>

          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'usuarios' ? ' active' : ''}`}
                onClick={() => setPestana('usuarios')}
              >
                <i className="bi bi-people me-1" />
                Usuarios ({usuarios.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'productos' ? ' active' : ''}`}
                onClick={() => setPestana('productos')}
              >
                <i className="bi bi-box me-1" />
                Productos ({productos.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'categorias' ? ' active' : ''}`}
                onClick={() => setPestana('categorias')}
              >
                <i className="bi bi-tags me-1" />
                Categorías ({categorias.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'ordenes' ? ' active' : ''}`}
                onClick={() => setPestana('ordenes')}
              >
                <i className="bi bi-receipt me-1" />
                Reservas globales ({ordenes.length})
              </button>
            </li>
          </ul>

          {/* PESTAÑA USUARIOS */}
          {pestana === 'usuarios' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Usuarios registrados</h5>
                <button className="btn btn-success rounded-pill px-4" onClick={abrirNuevoUsuario}>
                  <i className="bi bi-person-plus me-1" />
                  Nuevo usuario
                </button>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Región</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.correo}>
                          <td>{u.nombre} {u.apellido}</td>
                          <td>{u.correo}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                u.rol === 'administrador'
                                  ? 'bg-danger'
                                  : u.rol === 'recepcionista'
                                    ? 'bg-warning text-dark'
                                    : 'bg-success'
                              }`}
                            >
                              {u.rol}
                            </span>
                          </td>
                          <td>{u.region}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill me-2"
                              onClick={() => abrirEditarUsuario(u)}
                            >
                              <i className="bi bi-pencil me-1" />
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill"
                              onClick={() => manejarEliminarUsuario(u.id, u.correo)}
                            >
                              <i className="bi bi-trash me-1" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA PRODUCTOS */}
          {pestana === 'productos' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Productos</h5>
                <button className="btn btn-success rounded-pill px-4" onClick={abrirNuevoProducto}>
                  <i className="bi bi-plus-lg me-1" />
                  Nuevo producto
                </button>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p) => (
                        <tr key={p.codigo}>
                          <td><code>{p.codigo}</code></td>
                          <td>{p.nombre}</td>
                          <td>{p.tipo}</td>
                          <td>{formatPrecio(p.precio)}</td>
                          <td>
                            <StockBadge
                              disponible={Math.max(0, p.cuposIniciales)}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill me-2"
                              onClick={() => abrirEditarProducto(p)}
                            >
                              <i className="bi bi-pencil me-1" />
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill"
                              onClick={() => manejarEliminarProducto(p.codigo)}
                            >
                              <i className="bi bi-trash me-1" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA CATEGORÍAS */}
          {pestana === 'categorias' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Categorías</h5>
                <button className="btn btn-success rounded-pill px-4" onClick={abrirNuevaCategoria}>
                  <i className="bi bi-plus-lg me-1" />
                  Nueva categoría
                </button>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Productos asociados</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((c) => (
                        <tr key={c.id}>
                          <td>{c.nombre}</td>
                          <td>{productos.filter((p) => p.tipo === c.nombre).length}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill me-2"
                              onClick={() => abrirEditarCategoria(c)}
                            >
                              <i className="bi bi-pencil me-1" />
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill"
                              onClick={() => manejarEliminarCategoria(c.id)}
                            >
                              <i className="bi bi-trash me-1" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA ÓRDENES Y RESERVAS GLOBALES */}
          {pestana === 'ordenes' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <h5 className="fw-bold mb-1">Historial Global de Reservas</h5>
                  <p className="text-muted small mb-0">
                    Auditoría de compras y reservas de todos los clientes de la clínica
                  </p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="input-group input-group-sm" style={{ width: '240px' }}>
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      placeholder="Buscar por código o cliente..."
                      value={busquedaOrden}
                      onChange={(e) => setBusquedaOrden(e.target.value)}
                    />
                  </div>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn ${filtroEstadoOrden === 'TODAS' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setFiltroEstadoOrden('TODAS')}
                    >
                      Todas ({ordenes.length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filtroEstadoOrden === 'RESERVADA' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setFiltroEstadoOrden('RESERVADA')}
                    >
                      Reservadas ({ordenes.filter((o) => o.estado === 'RESERVADA').length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filtroEstadoOrden === 'CANCELADA' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setFiltroEstadoOrden('CANCELADA')}
                    >
                      Canceladas ({ordenes.filter((o) => o.estado === 'CANCELADA').length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body px-4 pb-4">
                {ordenesFiltradas.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50" />
                    <p className="mb-0">No se encontraron reservas con los filtros seleccionados.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light text-muted small text-uppercase">
                        <tr>
                          <th>Código</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesFiltradas.map((o) => {
                          const esReservada = o.estado === 'RESERVADA'
                          return (
                            <tr key={o.id}>
                              <td>
                                <span className="badge bg-light text-dark border px-2 py-1 rounded-pill fw-semibold">
                                  <i className="bi bi-receipt me-1 text-success" />
                                  {formatearCodigoOrden(o.id)}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <i className="bi bi-person-circle text-secondary fs-5" />
                                  <strong className="text-dark">{o.cliente || 'Cliente anónimo'}</strong>
                                </div>
                              </td>
                              <td className="small text-muted">{formatearFecha(o.fecha)}</td>
                              <td className="fw-bold text-dark">{formatPrecio(o.total)}</td>
                              <td>
                                <span
                                  className={`badge rounded-pill px-3 py-1 ${
                                    esReservada
                                      ? 'bg-success-subtle text-success border border-success-subtle'
                                      : 'bg-danger-subtle text-danger border border-danger-subtle'
                                  }`}
                                >
                                  <i className={`bi ${esReservada ? 'bi-check-circle' : 'bi-x-circle'} me-1`} />
                                  {o.estado}
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-secondary rounded-pill me-2 px-3"
                                  onClick={() => verDetalleOrden(o)}
                                  title="Ver desglose de la reserva"
                                >
                                  <i className="bi bi-eye me-1" />
                                  Ver detalle
                                </button>
                                {esReservada ? (
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                    onClick={() => manejarCancelarOrden(o)}
                                    title="Cancelar orden y devolver cupos"
                                  >
                                    <i className="bi bi-x-circle me-1" />
                                    Cancelar
                                  </button>
                                ) : (
                                  <span className="text-muted small fst-italic">Cancelada</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL USUARIO */}
      <AppModal show={modalUsuarioAbierto} onHide={() => setModalUsuarioAbierto(false)}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">
                {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalUsuarioAbierto(false)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body">
              <form onSubmit={guardarUsuario} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formUsuario.nombre}
                      onChange={(e) => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formUsuario.apellido}
                      onChange={(e) => setFormUsuario({ ...formUsuario, apellido: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Correo *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formUsuario.correo}
                      onChange={(e) => setFormUsuario({ ...formUsuario, correo: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contraseña *</label>
                    <PasswordInput
                      value={formUsuario.contrasena}
                      onChange={(v) => setFormUsuario({ ...formUsuario, contrasena: v })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Fecha de nacimiento *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formUsuario.fechaNacimiento}
                      max={hoy}
                      min={minFecha}
                      onChange={(e) =>
                        setFormUsuario({ ...formUsuario, fechaNacimiento: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Rol *</label>
                    <select
                      className="form-select"
                      value={formUsuario.rol}
                      disabled={Boolean(usuarioEditando && esUsuarioActual(usuarioEditando.correo))}
                      onChange={(e) =>
                        setFormUsuario({ ...formUsuario, rol: e.target.value as RolUsuario })
                      }
                    >
                      {OPCIONES_ROL.map((r) => (
                        <option key={r.valor} value={r.valor}>
                          {r.etiqueta}
                        </option>
                      ))}
                    </select>
                    {usuarioEditando && esUsuarioActual(usuarioEditando.correo) && (
                      <small className="text-muted">No puedes cambiar tu propio rol</small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Región *</label>
                    <select
                      className="form-select"
                      value={formUsuario.region}
                      onChange={(e) => setFormUsuario({ ...formUsuario, region: e.target.value })}
                    >
                      <option value="">Selecciona</option>
                      <option value="Metropolitana">Metropolitana</option>
                      <option value="Biobio">Biobío</option>
                      <option value="Araucania">La Araucanía</option>
                      <option value="Valparaiso">Valparaíso</option>
                      <option value="Coquimbo">Coquimbo</option>
                      <option value="Maule">Maule</option>
                      <option value="Antofagasta">Antofagasta</option>
                      <option value="Atacama">Atacama</option>
                      <option value="Arica">Arica y Parinacota</option>
                      <option value="Tarapaca">Tarapacá</option>
                      <option value="O'Higgins">O'Higgins</option>
                      <option value="Nuble">Ñuble</option>
                      <option value="Rios">Los Ríos</option>
                      <option value="Lagos">Los Lagos</option>
                      <option value="Aysen">Aysén</option>
                      <option value="Magallanes">Magallanes</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Género *</label>
                    <select
                      className="form-select"
                      value={formUsuario.genero}
                      onChange={(e) =>
                        setFormUsuario({
                          ...formUsuario,
                          genero: e.target.value as Genero | '',
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {OPCIONES_GENERO.map((g) => (
                        <option key={g.valor} value={g.valor}>
                          {g.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Dirección *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formUsuario.direccion}
                      onChange={(e) => setFormUsuario({ ...formUsuario, direccion: e.target.value })}
                    />
                  </div>
                </div>
                {errorForm && <div className="alert alert-danger mt-3 mb-0">{errorForm}</div>}
                <div className="modal-footer border-0 pt-3 px-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setModalUsuarioAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success rounded-pill px-4">
                    {usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AppModal>

      {/* MODAL PRODUCTO */}
      <AppModal show={modalProductoAbierto} onHide={() => setModalProductoAbierto(false)}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">
                {productoEditando ? 'Editar producto' : 'Nuevo producto'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalProductoAbierto(false)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body">
              <form onSubmit={guardarProducto} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formProducto.nombre}
                      onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-select"
                      value={formProducto.tipo}
                      onChange={(e) => setFormProducto({ ...formProducto, tipo: e.target.value })}
                    >
                      <option value="">Selecciona</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Precio (CLP) *</label>
                    <input
                      type="number"
                      className="form-control"
                      min={PRECIO_MINIMO}
                      max={PRECIO_MAXIMO}
                      value={formProducto.precio}
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, precio: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={STOCK_MAXIMO}
                      step={1}
                      value={formProducto.cuposIniciales}
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, cuposIniciales: Number(e.target.value) })
                      }
                    />
                    <small className="text-muted">Cupos disponibles para reservar</small>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Duración</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 50 min"
                      value={formProducto.duracion}
                      onChange={(e) => setFormProducto({ ...formProducto, duracion: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Modalidad</label>
                    <select
                      className="form-select"
                      value={formProducto.modalidad}
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, modalidad: e.target.value })
                      }
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Online (video)">Online (video)</option>
                      <option value="Presencial (grupo)">Presencial (grupo)</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formProducto.descripcion}
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, descripcion: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      <i className="bi bi-image me-1 text-success" />
                      URL de la imagen (Internet)
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={formProducto.imagenUrl ?? ''}
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, imagenUrl: e.target.value })
                      }
                    />
                    <small className="text-muted">
                      Ingresa la dirección web de una imagen para mostrarla en el catálogo y detalle.
                    </small>
                  </div>
                </div>
                {errorForm && <div className="alert alert-danger mt-3 mb-0">{errorForm}</div>}
                <div className="modal-footer border-0 pt-3 px-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setModalProductoAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success rounded-pill px-4">
                    {productoEditando ? 'Guardar cambios' : 'Crear producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AppModal>

      {/* MODAL CATEGORÍA */}
      <AppModal show={modalCategoriaAbierto} onHide={() => setModalCategoriaAbierto(false)}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">
                {categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalCategoriaAbierto(false)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body">
              {errorForm && <div className="alert alert-danger">{errorForm}</div>}
              <form onSubmit={guardarCategoria}>
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  value={nombreCategoria}
                  onChange={(e) => setNombreCategoria(e.target.value)}
                />
                <div className="modal-footer border-0 pt-3 px-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setModalCategoriaAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success rounded-pill px-4">
                    {categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AppModal>

      {/* MODAL NO ELIMINAR CUENTA PROPIA */}
      <AppModal
        show={modalPropiaCuentaAbierto}
        onHide={() => setModalPropiaCuentaAbierto(false)}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">Eliminar usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalPropiaCuentaAbierto(false)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body text-center">
              <i
                className="bi bi-exclamation-triangle-fill text-danger"
                style={{ fontSize: '3rem' }}
              />
              <p className="fw-bold text-dark mt-3 mb-0">No puedes eliminarte a ti mismo</p>
              <small className="text-muted">
                Tu cuenta de administrador debe permanecer activa para gestionar el sistema.
              </small>
            </div>
            <div className="modal-footer border-0 pt-2 justify-content-center">
              <button
                type="button"
                className="btn btn-success rounded-pill px-4"
                onClick={() => setModalPropiaCuentaAbierto(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </AppModal>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <AppModal show={confirmacion !== null} onHide={() => setConfirmacion(null)}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">Confirmar eliminación</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setConfirmacion(null)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body text-center">
              <i
                className="bi bi-exclamation-triangle-fill text-danger"
                style={{ fontSize: '3rem' }}
              />
              <p className="fw-bold text-dark mt-3 mb-0">{confirmacion?.mensaje}</p>
              <small className="text-muted">Esta acción no se puede deshacer.</small>
            </div>
            <div className="modal-footer border-0 pt-2 justify-content-center">
              <button
                type="button"
                className="btn btn-light rounded-pill px-4"
                onClick={() => setConfirmacion(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-pill px-4"
                onClick={() => {
                  confirmacion?.onConfirmar()
                  setConfirmacion(null)
                }}
              >
                <i className="bi bi-trash me-1" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </AppModal>

      {/* MODAL DETALLE DE ORDEN */}
      <AppModal show={modalDetalleOrden} onHide={() => setModalDetalleOrden(false)}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <div>
                <h5 className="modal-title fw-bold text-dark mb-1">
                  Detalle de Reserva {ordenDetalle ? formatearCodigoOrden(ordenDetalle.id) : ''}
                </h5>
                <p className="text-muted small mb-0">
                  Cliente: <strong>{ordenDetalle?.cliente || 'No especificado'}</strong> | Fecha: {ordenDetalle ? formatearFecha(ordenDetalle.fecha) : ''}
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalDetalleOrden(false)}
                aria-label="Cerrar"
              />
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light small text-uppercase text-secondary">
                    <tr>
                      <th>Servicio</th>
                      <th className="text-center" style={{ width: '90px' }}>Cant.</th>
                      <th className="text-end" style={{ width: '130px' }}>Precio unit.</th>
                      <th className="text-end" style={{ width: '130px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenDetalle?.detalles && ordenDetalle.detalles.length > 0 ? (
                      ordenDetalle.detalles.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <strong className="d-block text-dark">{d.productoNombre}</strong>
                            <small className="text-muted">Código: {d.productoCodigo}</small>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border px-2 py-1 rounded-pill">
                              {d.cantidad}
                            </span>
                          </td>
                          <td className="text-end">{formatPrecio(d.precioUnitario)}</td>
                          <td className="text-end fw-semibold">{formatPrecio(d.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-3 text-muted">
                          Sin líneas de detalle registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="table-light border-top">
                      <td colSpan={3} className="text-end fw-bold text-dark pt-3">
                        Total Pagado:
                      </td>
                      <td className="text-end fw-bold text-success fs-5 pt-3">
                        {ordenDetalle ? formatPrecio(ordenDetalle.total) : '$0'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light rounded-pill px-4"
                onClick={() => setModalDetalleOrden(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </AppModal>
    </main>
  )
}
