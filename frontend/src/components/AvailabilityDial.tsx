import type { Status } from '../types'

const CX = 120
const CY = 118
const R = 92
const START = -120
const SWEEP = 240
const END = START + SWEEP

// Góc tính theo chiều kim đồng hồ từ hướng 12 giờ
function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)] as const
}

function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from)
  const [x2, y2] = polar(r, to)
  return `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

const TICKS = Array.from({ length: 25 }, (_, i) => {
  const deg = START + (SWEEP * i) / 24
  const major = i % 6 === 0
  const [x1, y1] = polar(R - 13, deg)
  const [x2, y2] = polar(major ? R - 24 : R - 18, deg)
  return { x1, y1, x2, y2, major }
})

interface AvailabilityDialProps {
  total: number
  available: number
  categories: number
  loading: boolean
  status: 'all' | Status
  onStatus: (status: 'all' | Status) => void
}

export default function AvailabilityDial({
  total,
  available,
  categories,
  loading,
  status,
  onStatus,
}: AvailabilityDialProps) {
  const unavailable = total - available
  const ratio = total ? available / total : 0
  const angle = START + SWEEP * ratio
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const [zeroX, zeroY] = polar(R - 38, START + 8)
  const [maxX, maxY] = polar(R - 38, END - 8)

  return (
    <section className="module module--roast dial" aria-labelledby="dial-title">
      <header className="module__head">
        <h2 id="dial-title" className="engraved">
          Tình trạng phục vụ
        </h2>
        <span className="module__note">{loading ? '—' : `${categories} danh mục`}</span>
      </header>

      <div className="dial__face">
        <svg
          className="dial__svg"
          viewBox="0 0 240 172"
          role="img"
          aria-label={`${available} trên ${total} món còn hàng`}
        >
          <path d={arc(R, START, END)} className="dial__track" />
          {available > 0 && <path d={arc(R, START, angle)} className="dial__arc dial__arc--on" />}
          {unavailable > 0 && <path d={arc(R, angle, END)} className="dial__arc dial__arc--off" />}
          {TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={t.major ? 'dial__tick dial__tick--major' : 'dial__tick'}
            />
          ))}
          <text x={zeroX} y={zeroY} className="dial__scale" textAnchor="middle">
            0
          </text>
          <text x={maxX} y={maxY} className="dial__scale" textAnchor="middle">
            {total}
          </text>
          <g className="dial__needle" style={{ transform: `rotate(${angle}deg)` }}>
            <line x1={CX} y1={CY + 16} x2={CX} y2={CY - R + 22} />
          </g>
          <circle cx={CX} cy={CY} r="9" className="dial__hub" />
        </svg>
        <p className="dial__readout">
          <strong>{loading ? '—' : available}</strong>
          <span>/ {loading ? '—' : total} món còn phục vụ</span>
        </p>
      </div>

      <div className="dial__legend" role="group" aria-label="Lọc theo trạng thái">
        <button
          type="button"
          className="readout"
          aria-pressed={status === 'Còn'}
          onClick={() => onStatus(status === 'Còn' ? 'all' : 'Còn')}
        >
          <span className="readout__label">
            <span className="lamp lamp--green" aria-hidden="true" />
            Còn hàng
          </span>
          <span className="readout__value">
            {loading ? '—' : available}
            <small> · {pct(available)}%</small>
          </span>
        </button>
        <button
          type="button"
          className="readout"
          aria-pressed={status === 'Không khả dụng'}
          onClick={() => onStatus(status === 'Không khả dụng' ? 'all' : 'Không khả dụng')}
        >
          <span className="readout__label">
            <span className="lamp lamp--red" aria-hidden="true" />
            Không khả dụng
          </span>
          <span className="readout__value">
            {loading ? '—' : unavailable}
            <small> · {pct(unavailable)}%</small>
          </span>
        </button>
      </div>
    </section>
  )
}
