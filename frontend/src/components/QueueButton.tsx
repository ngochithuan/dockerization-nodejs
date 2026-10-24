import type { QueueStatus } from '../types'

interface QueueButtonProps {
  queue: QueueStatus | null
  error: string | null
  open: boolean
  onToggle: () => void
}

// Trạng thái hàng đợi RabbitMQ trên thanh trên cùng; bấm để mở bảng sự kiện
function queueState(queue: QueueStatus | null, error: string | null) {
  if (error || !queue) return { tone: 'amber', text: error ? 'Không đọc được hàng đợi' : 'Đang kết nối hàng đợi…' }
  if (!queue.connected) return { tone: 'red', text: 'RabbitMQ mất kết nối' }
  const waiting = queue.messages ?? 0
  const workers = queue.consumers ?? 0
  if (workers === 0) return { tone: 'red', text: `${waiting} tin chờ · không có worker` }
  if (waiting > 0) return { tone: 'amber', text: `${waiting} tin đang chờ xử lý` }
  return { tone: 'green', text: `Hàng đợi trống · ${workers} worker` }
}

export default function QueueButton({ queue, error, open, onToggle }: QueueButtonProps) {
  const state = queueState(queue, error)
  return (
    <button
      type="button"
      className={`api-lamp api-lamp--${state.tone} queue-btn`}
      aria-expanded={open}
      aria-controls="events-panel"
      onClick={onToggle}
      title="Hàng đợi sự kiện RabbitMQ"
    >
      <span className={`lamp lamp--${state.tone}${state.tone === 'amber' ? ' lamp--blink' : ''}`} aria-hidden="true" />
      <span className="api-lamp__text">{state.text}</span>
    </button>
  )
}
