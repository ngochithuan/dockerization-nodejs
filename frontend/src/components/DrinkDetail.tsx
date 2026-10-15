import { useEffect, useState, type CSSProperties } from 'react'
import { drinkApi } from '../api/drinks'
import { drinkStyle } from '../drinkStyle'
import type { Drink } from '../types'
import { errorMessage, formatDate, formatPrice } from '../utils'
import DrinkImage from './DrinkImage'
import StatusPill from './StatusPill'
import { EditIcon, TrashIcon } from './icons'

interface DrinkDetailProps {
  id: string
  onLoaded: (drink: Drink) => void
  onEdit: (drink: Drink) => void
  onDelete: (drink: Drink) => void
}

// Lấy dữ liệu mới nhất qua GET /api/drinks/:id
export default function DrinkDetail({ id, onLoaded, onEdit, onDelete }: DrinkDetailProps) {
  const [drink, setDrink] = useState<Drink | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    drinkApi
      .get(id)
      .then((data) => {
        if (ignore) return
        setDrink(data)
        onLoaded(data)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
    return () => {
      ignore = true
    }
  }, [id, onLoaded])

  if (error) return <p className="form-error">{error}</p>
  if (!drink) return <div className="detail-loading">Đang tải…</div>

  return (
    <>
      <div className="detail" style={{ '--drink': drinkStyle(drink.category).color } as CSSProperties}>
        <div className="detail__bay">
          <DrinkImage
            src={drink.image_url}
            name={drink.name}
            category={drink.category}
            size={drink.size}
          />
        </div>
        <div className="detail__info">
          <div className="drink__meta">
            <span className="cat">
              <span className="cat__swatch" aria-hidden="true" />
              {drink.category}
            </span>
            <StatusPill status={drink.status} />
          </div>
          <h3 className="detail__name">{drink.name}</h3>
          <p className="detail__price">{formatPrice(drink.price)}</p>
          <p className="detail__desc">{drink.description || 'Chưa có mô tả.'}</p>
          <dl className="detail__list">
            <div>
              <dt>Size</dt>
              <dd>{drink.size}</dd>
            </div>
            <div>
              <dt>Mã</dt>
              <dd>
                <code>{drink._id}</code>
              </dd>
            </div>
            <div>
              <dt>Ngày tạo</dt>
              <dd>{formatDate(drink.created_at)}</dd>
            </div>
            <div>
              <dt>Cập nhật</dt>
              <dd>{drink.updated_at ? formatDate(drink.updated_at) : 'Chưa cập nhật'}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="modal__footer">
        <button type="button" className="btn btn--danger-ghost" onClick={() => onDelete(drink)}>
          <TrashIcon /> Xóa
        </button>
        <button type="button" className="btn btn--primary" onClick={() => onEdit(drink)}>
          <EditIcon /> Chỉnh sửa
        </button>
      </div>
    </>
  )
}
