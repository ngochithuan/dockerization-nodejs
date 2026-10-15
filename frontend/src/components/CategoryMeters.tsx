import type { CSSProperties } from 'react'
import { drinkStyle } from '../drinkStyle'

export interface CategoryCount {
  category: string
  count: number
}

interface CategoryMetersProps {
  rows: CategoryCount[]
  active: string
  loading: boolean
  onSelect: (category: string) => void
}

export default function CategoryMeters({ rows, active, loading, onSelect }: CategoryMetersProps) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <section className="module meters" aria-labelledby="meters-title">
      <header className="module__head">
        <h2 id="meters-title" className="engraved">
          Số món theo danh mục
        </h2>
        <span className="module__note">Bấm một dòng để lọc</span>
      </header>

      {loading && rows.length === 0 ? (
        <ul className="meters__list" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="meter meter--ghost">
              <span className="meter__name" />
              <span className="meter__track" />
              <span className="meter__count" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="meters__empty">Chưa có danh mục nào.</p>
      ) : (
        <ul className={`meters__list${active !== 'all' ? ' has-active' : ''}`}>
          {rows.map((row) => (
            <li key={row.category}>
              <button
                type="button"
                className={`meter${active === row.category ? ' is-active' : ''}`}
                style={{ '--drink': drinkStyle(row.category).color } as CSSProperties}
                aria-pressed={active === row.category}
                onClick={() => onSelect(active === row.category ? 'all' : row.category)}
              >
                <span className="meter__name">
                  <span className="lamp lamp--amber" aria-hidden="true" />
                  {row.category}
                </span>
                <span className="meter__track">
                  <span className="meter__fill" style={{ width: `${(row.count / max) * 100}%` }} />
                </span>
                <span className="meter__count">{row.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
