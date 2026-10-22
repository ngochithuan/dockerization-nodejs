import { useEffect } from 'react'
import type { Activity, ActivityFeed } from '../types'
import { CloseIcon } from './icons'

interface EventsPanelProps {
  open: boolean
  feed: ActivityFeed | null
  error: string | null
  onClose: () => void
}

const TYPES: Record<string, { label: string; lamp: string }> = {
  'drink.created': { label: 'Thêm món', lamp: 'lamp--green' },
  'drink.updated': { label: 'Cập nhật', lamp: 'lamp--amber' },
  'drink.deleted': { label: 'Xóa món', lamp: 'lamp--red' },
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function waitSeconds(a: Activity) {
  if (!a.published_at || !a.processed_at) return null
  return ((Date.parse(a.processed_at) - Date.parse(a.published_at)) / 1000).toFixed(1)
}

// Bảng không chặn trang (không phải modal): vừa thao tác với menu vừa xem sự kiện chạy qua RabbitMQ
export default function EventsPanel({ open, feed, error, onClose }: EventsPanelProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const queue = feed?.queue
  const items = feed?.items ?? []

  return (
    <aside id="events-panel" className="events" hidden={!open} aria-labelledby="events-title">
      <header className="events__head">
        <h2 id="events-title">Hàng đợi sự kiện</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng bảng sự kiện">
          <CloseIcon />
        </button>
      </header>

      <div className="events__body">
        <p className="events__intro">
          Mỗi lần thêm, sửa hoặc xóa món, backend gửi một sự kiện vào queue <code>drink_events</code> của RabbitMQ
          rồi trả kết quả ngay. Service worker nhận sự kiện và xử lý sau, độc lập với backend.
        </p>

        <div className="events__gauges">
          <div className="gauge">
            <span className="gauge__label">RabbitMQ</span>
            <span className="gauge__value gauge__value--text">
              <span
                className={`lamp ${queue?.connected ? 'lamp--green' : 'lamp--red'}`}
                aria-hidden="true"
              />
              {queue ? (queue.connected ? 'Đã kết nối' : 'Mất kết nối') : '—'}
            </span>
          </div>
          <div className="gauge">
            <span className="gauge__label">Tin đang chờ</span>
            <span className={`gauge__value${(queue?.messages ?? 0) > 0 ? ' is-waiting' : ''}`}>
              {queue?.messages ?? '—'}
            </span>
          </div>
          <div className="gauge">
            <span className="gauge__label">Worker đang nghe</span>
            <span className={`gauge__value${queue?.consumers === 0 ? ' is-down' : ''}`}>
              {queue?.consumers ?? '—'}
            </span>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <h3 className="engraved events__list-title">Worker đã xử lý</h3>
        {items.length === 0 ? (
          <p className="events__empty">Chưa có sự kiện nào. Thử thêm, sửa hoặc xóa một món.</p>
        ) : (
          <ol className="events__list">
            {items.map((a) => {
              const t = TYPES[a.type] ?? { label: a.type, lamp: '' }
              const wait = waitSeconds(a)
              return (
                <li key={a._id} className="event">
                  <div className="event__top">
                    <span className="event__type">
                      <span className={`lamp ${t.lamp}`} aria-hidden="true" />
                      {t.label}
                    </span>
                    <time className="event__time" dateTime={a.processed_at}>
                      {a.processed_at ? timeFormat.format(new Date(a.processed_at)) : ''}
                    </time>
                  </div>
                  <p className="event__msg">{a.message}</p>
                  <p className="event__route">
                    <span title="Container backend đã gửi sự kiện">backend {a.published_by}</span>
                    <span aria-hidden="true">→</span>
                    <span title="Container worker đã xử lý">worker {a.processed_by}</span>
                    {wait && <span className="event__wait">sau {wait} giây</span>}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </aside>
  )
}
