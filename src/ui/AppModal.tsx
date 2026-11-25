/** Modal reutilizable para confirmaciones y formularios. */
import { useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'

interface AppModalProps {
  show: boolean
  onHide: () => void
  children: React.ReactNode
}

export default function AppModal({ show, onHide, children }: AppModalProps) {
  const elementoRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<Modal | null>(null)
  // Mantiene disponible la última función sin volver a crear el modal.
  const onHideRef = useRef(onHide)
  onHideRef.current = onHide

  useEffect(() => {
    const el = elementoRef.current
    if (!el) return

    if (!modalRef.current) {
      modalRef.current = new Modal(el)
      el.addEventListener('hidden.bs.modal', () => onHideRef.current())
    }

    if (show) {
      modalRef.current.show()
    } else {
      modalRef.current.hide()
    }
  }, [show])

  // Quita la capa oscura y restaura la página al cerrar el componente.
  useEffect(() => {
    return () => {
      modalRef.current?.dispose()
      modalRef.current = null
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
      document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove())
    }
  }, [])

  return (
    <div className="modal fade" ref={elementoRef} tabIndex={-1}>
      {children}
    </div>
  )
}
