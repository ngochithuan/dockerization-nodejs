import type { Topping, VesselKind } from '../drinkStyle'
import type { Size } from '../types'

const SCALE: Record<Size, number> = { S: 0.8, M: 0.9, L: 1 }
const LINE = '#7d756d'
const GLASS = 'rgba(255, 255, 255, 0.5)'
const STRAW = '#3b2b21'
const CREAM = '#fbf5ee'

interface VesselProps {
  kind: VesselKind
  topping: Topping
  color: string
  size: Size
  className?: string
}

function Ice({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <rect
      x={x}
      y={y}
      width="13"
      height="13"
      rx="2.5"
      transform={`rotate(${r} ${x + 6.5} ${y + 6.5})`}
      fill="rgba(255, 255, 255, 0.55)"
      stroke="rgba(255, 255, 255, 0.9)"
      strokeWidth="1.5"
    />
  )
}

function Highlight({ d }: { d: string }) {
  return <path d={d} stroke="#fff" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
}

function Tall({ color, topping }: { color: string; topping: Topping }) {
  const body = 'M32 30 L88 30 L82 128 L38 128 Z'
  return (
    <>
      <line x1="72" y1="8" x2="63" y2="104" stroke={STRAW} strokeWidth="5" strokeLinecap="round" />
      <path d={body} fill={GLASS} />
      <path d="M36.4 52 L83.6 52 L79.2 125 L40.8 125 Z" fill={color} fillOpacity="0.92" />
      {topping === 'ice' && (
        <>
          <Ice x={43} y={56} r={-12} />
          <Ice x={60} y={63} r={14} />
        </>
      )}
      <path d={body} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <Highlight d="M39 40 L43 112" />
    </>
  )
}

function Dome({ color, topping }: { color: string; topping: Topping }) {
  const body = 'M34 50 L86 50 L78 128 L42 128 Z'
  return (
    <>
      <line x1="66" y1="2" x2="58" y2="108" stroke={STRAW} strokeWidth="6" strokeLinecap="round" />
      <path d={body} fill={GLASS} />
      <path d="M38 60 L82 60 L75.3 125 L44.7 125 Z" fill={color} fillOpacity="0.92" />
      {topping === 'pearls' && (
        <g fill="#2a1a12">
          {[50, 57, 64, 71].map((cx) => (
            <circle key={cx} cx={cx} cy="119" r="4" />
          ))}
          {[53.5, 60.5, 67.5].map((cx) => (
            <circle key={cx} cx={cx} cy="112" r="4" />
          ))}
        </g>
      )}
      {topping === 'cream' && (
        <path d="M38 60 q5.5 -7 11 0 t11 0 t11 0 t11 0 L81.3 67 L38.7 67 Z" fill={CREAM} />
      )}
      <path d={body} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 50 A30 27 0 0 1 90 50" fill="rgba(255, 255, 255, 0.35)" stroke={LINE} strokeWidth="2.5" />
      <rect x="27" y="47" width="66" height="6" rx="3" fill="#f7f5f2" stroke={LINE} strokeWidth="2.5" />
      <Highlight d="M41 62 L46 116" />
    </>
  )
}

function Phin({ color }: { color: string }) {
  const glass = 'M34 66 L86 66 L82 128 L38 128 Z'
  const metal = '#d3cfc9'
  return (
    <>
      <path d={glass} fill={GLASS} />
      <path d="M38.2 84 L81.8 84 L79.2 125 L40.8 125 Z" fill={color} fillOpacity="0.94" />
      <Ice x={44} y={87} r={-10} />
      <Ice x={61} y={90} r={12} />
      <circle cx="60" cy="75" r="2.6" fill={color} />
      <path d={glass} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="30" y="58" width="60" height="7" rx="3" fill={metal} stroke={LINE} strokeWidth="2.5" />
      <path d="M41 30 L79 30 L76 58 L44 58 Z" fill={metal} stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="45" y="22" width="30" height="8" rx="2" fill={metal} stroke={LINE} strokeWidth="2.5" />
      <rect x="55" y="15" width="10" height="7" rx="2" fill={metal} stroke={LINE} strokeWidth="2.5" />
      <Highlight d="M39 74 L42 116" />
    </>
  )
}

function Mug({ color }: { color: string }) {
  const body = 'M34 60 L80 60 L80 116 Q80 126 70 126 L44 126 Q34 126 34 116 Z'
  return (
    <>
      <g fill="none" stroke={LINE} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round">
        <path d="M47 50 q-5 -6 0 -12 t0 -12" />
        <path d="M57 46 q-5 -6 0 -12 t0 -12" />
        <path d="M67 50 q-5 -6 0 -12 t0 -12" />
      </g>
      <path d="M80 72 h7 a12 12 0 0 1 0 24 h-7" fill="none" stroke={LINE} strokeWidth="8" />
      <path d="M80 72 h7 a12 12 0 0 1 0 24 h-7" fill="none" stroke="#fbf7f1" strokeWidth="3" />
      <path d={body} fill="#fbf7f1" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="35.3" y="88" width="43.4" height="9" fill={color} />
      <ellipse cx="57" cy="61" rx="21.5" ry="4" fill={color} stroke={LINE} strokeWidth="2" />
    </>
  )
}

function Jar({ color }: { color: string }) {
  const body = 'M38 56 L82 56 L82 120 Q82 128 74 128 L46 128 Q38 128 38 120 Z'
  return (
    <>
      <path d={body} fill={GLASS} />
      <path d="M41 66 L79 66 L79 98 L41 98 Z" fill={CREAM} />
      <path d="M41 98 L79 98 L79 119 Q79 125 73 125 L47 125 Q41 125 41 119 Z" fill={color} />
      <path d="M41 98 q4.75 5 9.5 0 t9.5 0 t9.5 0 t9.5 0 Z" fill={CREAM} />
      <path d={body} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="35" y="45" width="50" height="11" rx="3" fill={color} stroke={LINE} strokeWidth="2.5" />
      <Highlight d="M44 66 L44 116" />
    </>
  )
}

// Ly minh họa: kiểu ly theo danh mục, màu theo đồ uống, kích thước theo size S/M/L
export default function Vessel({ kind, topping, color, size, className }: VesselProps) {
  const s = SCALE[size]
  return (
    <svg className={className} viewBox="0 0 120 140" aria-hidden="true">
      <ellipse cx="60" cy="131" rx={32 * s} ry="3.5" fill="rgba(40, 25, 15, 0.16)" />
      <g transform={`translate(60 130) scale(${s}) translate(-60 -130)`}>
        {kind === 'tall' && <Tall color={color} topping={topping} />}
        {kind === 'dome' && <Dome color={color} topping={topping} />}
        {kind === 'phin' && <Phin color={color} />}
        {kind === 'mug' && <Mug color={color} />}
        {kind === 'jar' && <Jar color={color} />}
      </g>
    </svg>
  )
}
