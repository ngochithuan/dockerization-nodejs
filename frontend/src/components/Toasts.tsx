import type { Toast } from '../hooks/useToasts'
import { CloseIcon } from './icons'

interface ToastsProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span
            className={`lamp ${toast.type === 'success' ? 'lamp--green' : 'lamp--red'}`}
            aria-hidden="true"
          />
          <span className="toast__msg">{toast.message}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onDismiss(toast.id)}
            aria-label="Đóng thông báo"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
