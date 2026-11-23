/**
 * Historial de compras y reservas del cliente (Fase 11.2).
 * Muestra las órdenes del usuario autenticado obtenidas desde /api/v1/ordenes/mias,
 * conservando los precios unitarios históricos registrados al momento de la compra.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../layout/Breadcrumb'
import { listarMisOrdenes } from '../services/ordenService'
import type { Orden } from '../types'
import { formatPrecio, formatearCodigoOrden } from '../utils/format'

export default function HistorialPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Mis Reservas - Clínica NutriVida'
    async function cargarHistorial() {
      try {
        setCargando(true)
        setError(null)
        const data = await listarMisOrdenes()
        setOrdenes(data)
      } catch {
        setError('No se pudo cargar el historial de reservas. Verifica tu conexión.')
      } finally {
        setCargando(false)
      }
    }
    cargarHistorial()
  }, [])

  function formatearFecha(isoString: string): string {
    try {
      const fecha = new Date(isoString)
      return fecha.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <main className="pt-5">
      <section className="py-5 mt-2">
        <div className="container">
          <Breadcrumb
            navClassName="mb-3"
            items={[{ label: 'Inicio', to: '/' }, { label: 'Mis reservas' }]}
          />

          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
            <div>
              <h1 className="section-title text-start mb-1">Mis Reservas</h1>
              <p className="text-muted mb-0">
                Consulta el historial de tus atenciones nutricionales y el detalle de cada reserva
              </p>
            </div>
            <Link to="/servicios" className="btn btn-outline-success rounded-pill px-4">
              <i className="bi bi-plus-circle me-1" />
              Nueva reserva
            </Link>
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3 text-muted">Cargando tu historial de compras y reservas...</p>
            </div>
          ) : error ? (
            <div className="alert alert-warning border-0 shadow-sm rounded-4 p-4 text-center my-4">
              <i className="bi bi-exclamation-triangle fs-3 text-warning d-block mb-2" />
              <p className="mb-0">{error}</p>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-3">
              <div className="mb-3">
                <div
                  className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: '80px', height: '80px' }}
                >
                  <i className="bi bi-calendar-x fs-1" />
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-2">Aún no tienes reservas registradas</h3>
              <p className="text-muted mx-auto mb-4" style={{ maxWidth: '480px' }}>
                Cuando reserves una consulta o adquieras un plan nutricional, podrás revisar aquí los
                detalles de tu compra y los precios correspondientes.
              </p>
              <div>
                <Link to="/servicios" className="btn btn-success rounded-pill px-4 py-2 fw-semibold">
                  <i className="bi bi-grid me-2" />
                  Explorar catálogo de servicios
                </Link>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {ordenes.map((orden) => {
                const esReservada = orden.estado === 'RESERVADA'
                return (
                  <div
                    key={orden.id}
                    className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
                  >
                    {/* ENCABEZADO DE LA ORDEN */}
                    <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fs-6 fw-semibold">
                          <i className="bi bi-receipt me-1 text-success" />
                          Código de orden: {formatearCodigoOrden(orden.id)}
                        </span>
                        <span className="text-muted small">
                          <i className="bi bi-calendar3 me-1" />
                          {formatearFecha(orden.fecha)}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            esReservada
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-danger-subtle text-danger border border-danger-subtle'
                          }`}
                        >
                          <i
                            className={`bi ${esReservada ? 'bi-check-circle' : 'bi-x-circle'} me-1`}
                          />
                          {orden.estado}
                        </span>
                      </div>
                    </div>

                    {/* LÍNEAS DE DETALLE CON PRECIO HISTÓRICO */}
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light small text-uppercase text-secondary">
                            <tr>
                              <th className="ps-4 py-3">Servicio</th>
                              <th className="py-3 text-center" style={{ width: '100px' }}>
                                Cantidad
                              </th>
                              <th className="py-3 text-end" style={{ width: '160px' }}>
                                Precio unitario (histórico)
                              </th>
                              <th className="pe-4 py-3 text-end" style={{ width: '160px' }}>
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {orden.detalles && orden.detalles.length > 0 ? (
                              orden.detalles.map((detalle) => (
                                <tr key={detalle.id}>
                                  <td className="ps-4 py-3">
                                    <div className="fw-semibold text-dark">
                                      {detalle.productoNombre}
                                    </div>
                                    <span className="text-muted small">
                                      Código: {detalle.productoCodigo}
                                    </span>
                                  </td>
                                  <td className="py-3 text-center fw-bold">
                                    {detalle.cantidad}
                                  </td>
                                  <td className="py-3 text-end text-muted">
                                    {formatPrecio(detalle.precioUnitario)}
                                  </td>
                                  <td className="pe-4 py-3 text-end fw-bold text-dark">
                                    {formatPrecio(detalle.subtotal)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center py-3 text-muted">
                                  Detalles no disponibles
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* PIE DE ORDEN: TOTAL */}
                    <div className="card-footer bg-light border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">
                        * Los precios mostrados corresponden al valor del momento de la compra.
                      </span>
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="text-secondary fw-semibold">Total:</span>
                        <span className="fs-4 fw-bold text-success">
                          {formatPrecio(orden.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
