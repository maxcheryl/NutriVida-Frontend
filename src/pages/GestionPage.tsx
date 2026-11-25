/** Panel para actualizar cupos y crear cuentas de clientes. */
import { useEffect, useState, type FormEvent } from 'react'
import { EDAD_MAXIMA, OPCIONES_GENERO, STOCK_MAXIMO } from '../constants'
import { useToast } from '../contexts/ToastContext'
import { listarProductos, actualizarStock } from '../services/productoService'
import { listarTodasOrdenes } from '../services/ordenService'
import { crearUsuario } from '../services/usuarioService'
import { mensajeDeError } from '../api/axiosConfig'
import type { Genero, Servicio, Orden } from '../types'
import AppModal from '../ui/AppModal'
import PasswordInput from '../ui/PasswordInput'
import StockBadge from '../ui/StockBadge'
import { formatPrecio, formatearCodigoOrden } from '../utils/format'
import { validarContrasena, esDominioDuoc, calcularEdad } from '../utils/validators'

type Pestana = 'stock' | 'clientes' | 'ordenes'

export default function GestionPage() {
  const { showToast } = useToast()
  const [pestana, setPestana] = useState<Pestana>('stock')
  const [productos, setProductos] = useState<Servicio[]>([])
  const [stockEditado, setStockEditado] = useState<Record<string, number>>({})
  const [errorStock, setErrorStock] = useState<string | null>(null)
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null)
  const [modalDetalleOrden, setModalDetalleOrden] = useState(false)
  const [filtroEstadoOrden, setFiltroEstadoOrden] = useState<'TODAS' | 'RESERVADA' | 'CANCELADA'>('TODAS')
  const [busquedaOrden, setBusquedaOrden] = useState('')
  const hoy = new Date().toISOString().split('T')[0]
  const fechaMinima = new Date()
  fechaMinima.setFullYear(fechaMinima.getFullYear() - EDAD_MAXIMA)
  const minFecha = fechaMinima.toISOString().split('T')[0]

  async function cargarDatos() {
    try {
      const [prods, ords] = await Promise.all([
        listarProductos(),
        listarTodasOrdenes(),
      ])
      setProductos(prods)
      setOrdenes(ords)
    } catch {
      // Si falla esta carga secundaria, mantenemos disponible el resto del panel.
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

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

  const [formCliente, setFormCliente] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    fechaNacimiento: '',
    contrasena: '',
    genero: '',
    region: '',
    direccion: '',
  })
  const [errorCliente, setErrorCliente] = useState<string | null>(null)

  function manejarStockChange(codigo: string, valor: number) {
    setErrorStock(null)
    setStockEditado({ ...stockEditado, [codigo]: valor })
  }

  async function guardarStock(codigo: string) {
    setErrorStock(null)
    const nuevoStock = stockEditado[codigo]
    if (nuevoStock === undefined) return
    // Un campo vacío no es un número válido, así que se muestra su error.
    if (!Number.isInteger(nuevoStock) || nuevoStock < 0 || nuevoStock > STOCK_MAXIMO) {
      setErrorStock(`El stock de ${codigo} debe ser un número entero entre 0 y ${STOCK_MAXIMO}`)
      return
    }
    try {
      await actualizarStock(codigo, nuevoStock)
      const data = await listarProductos()
      setProductos(data)
      // Si no hay un valor nuevo, se conserva el cupo actual.
      setStockEditado({ ...stockEditado, [codigo]: undefined as unknown as number })
      showToast('Stock actualizado correctamente', 'success')
    } catch (err) {
      setErrorStock(mensajeDeError(err))
    }
  }

  async function manejarCrearCliente(e: FormEvent) {
    e.preventDefault()
    setErrorCliente(null)

    if (
      !formCliente.nombre.trim() ||
      !formCliente.apellido.trim() ||
      !formCliente.correo.trim() ||
      !formCliente.contrasena.trim() ||
      !formCliente.fechaNacimiento ||
      !formCliente.genero ||
      !formCliente.region.trim() ||
      !formCliente.direccion.trim()
    ) {
      setErrorCliente('Todos los campos son obligatorios')
      return
    }
    if (!esDominioDuoc(formCliente.correo.trim())) {
      setErrorCliente('El correo debe ser del dominio @duocuc.cl')
      return
    }
    if (!validarContrasena(formCliente.contrasena)) {
      setErrorCliente('La contraseña debe contener 8 carácteres, una mayúscula, una minúscula y un número')
      return
    }
    if (formCliente.fechaNacimiento > hoy) {
      setErrorCliente('La fecha de nacimiento no puede ser posterior al día de hoy')
      return
    }
    if (calcularEdad(formCliente.fechaNacimiento) < 14) {
      setErrorCliente('El usuario es solo para personas mayores a 14 años')
      return
    }
    if (calcularEdad(formCliente.fechaNacimiento) > EDAD_MAXIMA) {
      setErrorCliente(`La edad máxima permitida es de ${EDAD_MAXIMA} años`)
      return
    }

    try {
      await crearUsuario({
        nombre: formCliente.nombre.trim(),
        apellido: formCliente.apellido.trim(),
        correo: formCliente.correo.trim().toLowerCase(),
        fechaNacimiento: formCliente.fechaNacimiento,
        contrasena: formCliente.contrasena,
        genero: formCliente.genero as Genero | '',
        region: formCliente.region,
        direccion: formCliente.direccion.trim(),
        rol: 'cliente',
      })

      showToast('Cliente registrado correctamente', 'success')
      setFormCliente({
        nombre: '',
        apellido: '',
        correo: '',
        fechaNacimiento: '',
        contrasena: '',
        genero: '',
        region: '',
        direccion: '',
      })
    } catch (err) {
      setErrorCliente(mensajeDeError(err))
    }
  }

  return (
    <main className="pt-5">
      <section className="py-5 mt-2">
        <div className="container">
          <div className="mb-4">
            <h1 className="section-title text-start mb-1">Gestión</h1>
            <p className="text-muted mb-0">Administra el stock de productos y registra clientes</p>
          </div>

          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'stock' ? ' active' : ''}`}
                onClick={() => setPestana('stock')}
              >
                <i className="bi bi-box me-1" />
                Stock de productos ({productos.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${pestana === 'clientes' ? ' active' : ''}`}
                onClick={() => setPestana('clientes')}
              >
                <i className="bi bi-person-plus me-1" />
                Registrar cliente
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

          {/* PESTAÑA STOCK */}
          {pestana === 'stock' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-box-seam me-2" />
                  Stock de productos
                </h5>
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
                        <th>Stock actual</th>
                        <th>Nuevo stock</th>
                        <th className="text-end">Acción</th>
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
                          <td style={{ width: '120px' }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min={0}
                              max={STOCK_MAXIMO}
                              step={1}
                              value={
                                stockEditado[p.codigo] ??
                                Math.max(0, p.cuposIniciales)
                              }
                              onChange={(e) =>
                                manejarStockChange(
                                  p.codigo,
                                  e.target.value.trim() === '' ? Number.NaN : Number(e.target.value),
                                )
                              }
                            />
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-success rounded-pill"
                              onClick={() => guardarStock(p.codigo)}
                            >
                              <i className="bi bi-check-lg me-1" />
                              Guardar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errorStock && (
                  <div className="alert alert-danger mt-3 mb-0">{errorStock}</div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA REGISTRAR CLIENTE */}
          {pestana === 'clientes' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-person-plus me-2" />
                  Registrar cliente
                </h5>
              </div>
              <div className="card-body px-4 pb-4">
                <form onSubmit={manejarCrearCliente} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formCliente.nombre}
                        onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Apellido *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formCliente.apellido}
                        onChange={(e) => setFormCliente({ ...formCliente, apellido: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Correo *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="usuario@duocuc.cl"
                        value={formCliente.correo}
                        onChange={(e) => setFormCliente({ ...formCliente, correo: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contraseña *</label>
                      <PasswordInput
                        placeholder="Mín. 8 caracteres, mayúscula, minúscula y número"
                        value={formCliente.contrasena}
                        onChange={(v) => setFormCliente({ ...formCliente, contrasena: v })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fecha de nacimiento *</label>
                      <input
                        type="date"
                        className="form-control"
                        max={hoy}
                        min={minFecha}
                        value={formCliente.fechaNacimiento}
                        onChange={(e) =>
                          setFormCliente({ ...formCliente, fechaNacimiento: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Región *</label>
                      <select
                        className="form-select"
                        value={formCliente.region}
                        onChange={(e) => setFormCliente({ ...formCliente, region: e.target.value })}
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
                        value={formCliente.genero}
                        onChange={(e) => setFormCliente({ ...formCliente, genero: e.target.value })}
                      >
                        <option value="">Selecciona</option>
                        {OPCIONES_GENERO.map((g) => (
                          <option key={g.valor} value={g.valor}>
                            {g.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Dirección *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formCliente.direccion}
                        onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <span className="badge bg-info text-dark rounded-pill">
                        El usuario se creará con rol Cliente
                      </span>
                    </div>
                  </div>
                  {errorCliente && <div className="alert alert-danger mt-3 mb-0">{errorCliente}</div>}
                  <div className="mt-4">
                    <button type="submit" className="btn btn-success rounded-pill px-4">
                      <i className="bi bi-person-plus me-1" />
                      Registrar cliente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PESTAÑA ÓRDENES Y RESERVAS GLOBALES */}
          {pestana === 'ordenes' && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <h5 className="fw-bold mb-1">
                    <i className="bi bi-receipt me-2 text-success" />
                    Historial Global de Reservas
                  </h5>
                  <p className="text-muted small mb-0">
                    Consulta el listado de reservas y compras de todos los clientes
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
                          <th className="text-end">Acción</th>
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
                                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                  onClick={() => verDetalleOrden(o)}
                                  title="Ver desglose de la reserva"
                                >
                                  <i className="bi bi-eye me-1" />
                                  Ver detalle
                                </button>
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
