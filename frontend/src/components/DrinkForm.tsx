import { useId, useState, type CSSProperties, type FormEvent } from 'react'
import { drinkStyle } from '../drinkStyle'
import {
  DEFAULT_IMAGE_URL,
  SIZES,
  STATUSES,
  type Drink,
  type DrinkInput,
  type Size,
  type Status,
} from '../types'
import { errorMessage, formatPrice } from '../utils'
import DrinkImage from './DrinkImage'

interface DrinkFormProps {
  initial?: Drink
  categories: string[]
  onSubmit: (data: DrinkInput) => Promise<void>
  onCancel: () => void
}

interface Values {
  name: string
  category: string
  description: string
  price: string
  size: Size
  image_url: string
  status: Status
}

type Errors = Partial<Record<keyof Values, string>>

function toValues(drink?: Drink): Values {
  return {
    name: drink?.name ?? '',
    category: drink?.category ?? '',
    description: drink?.description ?? '',
    price: drink ? String(drink.price) : '',
    size: drink?.size ?? 'M',
    image_url: drink && drink.image_url !== DEFAULT_IMAGE_URL ? drink.image_url : '',
    status: drink?.status ?? 'Còn',
  }
}

function validate(values: Values): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Vui lòng nhập tên đồ uống'
  if (!values.category.trim()) errors.category = 'Vui lòng nhập danh mục'

  const price = Number(values.price)
  if (values.price.trim() === '') errors.price = 'Vui lòng nhập giá'
  else if (!Number.isFinite(price) || price < 0) errors.price = 'Giá phải là số không âm'

  const url = values.image_url.trim()
  if (url && !/^https?:\/\/\S+$/i.test(url)) errors.image_url = 'URL phải bắt đầu bằng http(s)://'
  return errors
}

export default function DrinkForm({ initial, categories, onSubmit, onCancel }: DrinkFormProps) {
  const [values, setValues] = useState(() => toValues(initial))
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const uid = useId()
  const fieldId = (key: keyof Values) => `${uid}-${key}`

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setServerError(null)
    try {
      await onSubmit({
        name: values.name.trim(),
        category: values.category.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        size: values.size,
        image_url: values.image_url.trim() || DEFAULT_IMAGE_URL,
        status: values.status,
      })
    } catch (err) {
      setServerError(errorMessage(err))
      setSubmitting(false)
    }
  }

  const priceNumber = Number(values.price)
  const showPriceHint = values.price.trim() !== '' && Number.isFinite(priceNumber) && priceNumber >= 0

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div
        className="form__preview"
        style={{ '--drink': drinkStyle(values.category).color } as CSSProperties}
        aria-hidden="true"
      >
        <DrinkImage
          src={values.image_url.trim()}
          name={values.name || '?'}
          category={values.category}
          size={values.size}
        />
        <span className="form__preview-name">{values.name.trim() || 'Đồ uống mới'}</span>
        <span className="form__preview-meta">
          {values.category.trim() || 'Chưa chọn danh mục'} · Size {values.size}
        </span>
      </div>

      <div className="form__fields">
      <div className="field field--full">
        <label htmlFor={fieldId('name')}>
          Tên đồ uống <span className="req">*</span>
        </label>
        <input
          id={fieldId('name')}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="VD: Cà phê sữa đá"
          aria-invalid={!!errors.name}
          autoFocus
        />
        {errors.name && <span className="field__error">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor={fieldId('category')}>
          Danh mục <span className="req">*</span>
        </label>
        <input
          id={fieldId('category')}
          list={`${uid}-categories`}
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="VD: Cà phê"
          aria-invalid={!!errors.category}
        />
        <datalist id={`${uid}-categories`}>
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {errors.category && <span className="field__error">{errors.category}</span>}
      </div>

      <div className="field">
        <label htmlFor={fieldId('price')}>
          Giá (VNĐ) <span className="req">*</span>
        </label>
        <input
          id={fieldId('price')}
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={values.price}
          onChange={(e) => set('price', e.target.value)}
          placeholder="25000"
          aria-invalid={!!errors.price}
        />
        {errors.price ? (
          <span className="field__error">{errors.price}</span>
        ) : (
          showPriceHint && <span className="field__hint">{formatPrice(priceNumber)}</span>
        )}
      </div>

      <fieldset className="field">
        <legend>
          Size <span className="req">*</span>
        </legend>
        <div className="segmented">
          {SIZES.map((size) => (
            <label key={size}>
              <input
                type="radio"
                name={`${uid}-size`}
                value={size}
                checked={values.size === size}
                onChange={() => set('size', size)}
              />
              <span>{size}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Trạng thái</legend>
        <div className="segmented">
          {STATUSES.map((status) => (
            <label key={status}>
              <input
                type="radio"
                name={`${uid}-status`}
                value={status}
                checked={values.status === status}
                onChange={() => set('status', status)}
              />
              <span>{status === 'Còn' ? 'Còn hàng' : status}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field field--full">
        <label htmlFor={fieldId('image_url')}>Ảnh (URL)</label>
        <input
          id={fieldId('image_url')}
          type="url"
          value={values.image_url}
          onChange={(e) => set('image_url', e.target.value)}
          placeholder="https://… (để trống sẽ dùng ly minh họa)"
          aria-invalid={!!errors.image_url}
        />
        {errors.image_url && <span className="field__error">{errors.image_url}</span>}
      </div>

      <div className="field field--full">
        <label htmlFor={fieldId('description')}>Mô tả</label>
        <textarea
          id={fieldId('description')}
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Mô tả ngắn về hương vị, thành phần…"
        />
      </div>

      {serverError && <p className="form-error field--full">{serverError}</p>}
      </div>

      <div className="modal__footer form__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Hủy
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Thêm đồ uống'}
        </button>
      </div>
    </form>
  )
}
