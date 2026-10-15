import { useEffect, useId, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Modal({ open, title, onClose, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onClose={onClose}
      // Chỉ đóng khi cả nhấn và thả chuột đều trên backdrop (tránh đóng khi kéo chọn chữ trong input)
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="modal__inner">
          <header className="modal__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
              <CloseIcon />
            </button>
          </header>
          <div className="modal__body">{children}</div>
        </div>
      )}
    </dialog>
  )
}
