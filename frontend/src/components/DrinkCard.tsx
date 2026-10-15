import type { CSSProperties } from 'react'
import { drinkStyle } from '../drinkStyle'
import type { Drink } from '../types'
import { formatPrice } from '../utils'
import DrinkImage from './DrinkImage'
import StatusPill from './StatusPill'
import { EditIcon, TrashIcon } from './icons'

interface DrinkCardProps {
  drink: Drink
  fresh: boolean
  onSeen: (id: string) => void
  onView: (drink: Drink) => void
  onEdit: (drink: Drink) => void
  onDelete: (drink: Drink) => void
}

export default function DrinkCard({ drink, fresh, onSeen, onView, onEdit, onDelete }: DrinkCardProps) {
  const available = drink.status === 'Còn'
  const color = drinkStyle(drink.category).color

  return (
    <article
      id={`drink-${drink._id}`}
      className={`drink${available ? '' : ' is-off'}${fresh ? ' is-fresh' : ''}`}
      style={{ '--drink': color } as CSSProperties}
      // Đèn hổ phách giữ sáng tới khi người dùng rê chuột qua món vừa thay đổi
      onMouseLeave={fresh ? () => onSeen(drink._id) : undefined}
    >
      <button
        type="button"
        className="drink__bay"
        onClick={() => onView(drink)}
        aria-label={`Xem chi tiết ${drink.name}`}
      >
        <DrinkImage
          src={drink.image_url}
          name={drink.name}
          category={drink.category}
          size={drink.size}
        />
        <span className="drink__size" aria-label={`Size ${drink.size}`}>
          {drink.size}
        </span>
        {fresh && (
          <span className="drink__fresh">
            <span className="lamp lamp--amber" aria-hidden="true" />
            Vừa cập nhật
          </span>
        )}
      </button>

      <div className="drink__body">
        <div className="drink__meta">
          <span className="cat">
            <span className="cat__swatch" aria-hidden="true" />
            {drink.category}
          </span>
          <StatusPill status={drink.status} />
        </div>
        <h3 className="drink__name">
          <button type="button" onClick={() => onView(drink)}>
            {drink.name}
          </button>
        </h3>
        <p className="drink__desc">{drink.description || 'Chưa có mô tả.'}</p>
      </div>

      <footer className="drink__foot">
        <strong className="drink__price">{formatPrice(drink.price)}</strong>
        <div className="drink__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onEdit(drink)}
            aria-label={`Sửa ${drink.name}`}
            title="Sửa"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={() => onDelete(drink)}
            aria-label={`Xóa ${drink.name}`}
            title="Xóa"
          >
            <TrashIcon />
          </button>
        </div>
      </footer>
    </article>
  )
}
