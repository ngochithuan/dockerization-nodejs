import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, drinkApi } from './api/drinks'
import AvailabilityDial from './components/AvailabilityDial'
import CategoryMeters, { type CategoryCount } from './components/CategoryMeters'
import ConfirmDelete from './components/ConfirmDelete'
import DrinkCard from './components/DrinkCard'
import DrinkDetail from './components/DrinkDetail'
import DrinkForm from './components/DrinkForm'
import Modal from './components/Modal'
import Toasts from './components/Toasts'
import {
  ChevronIcon,
  CloseIcon,
  CupIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
} from './components/icons'
import { useToasts } from './hooks/useToasts'
import type { Drink, DrinkInput, Status } from './types'
import { errorMessage, normalizeText } from './utils'
import './App.css'

type SortKey = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name'
type FormState = { mode: 'create' } | { mode: 'edit'; drink: Drink } | null

const SORTS: Record<SortKey, { label: string; compare: (a: Drink, b: Drink) => number }> = {
  newest: { label: 'Mới nhất', compare: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) },
  oldest: { label: 'Cũ nhất', compare: (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) },
  'price-asc': { label: 'Giá tăng dần', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Giá giảm dần', compare: (a, b) => b.price - a.price },
  name: { label: 'Tên A → Z', compare: (a, b) => a.name.localeCompare(b.name, 'vi') },
}

const STATUS_KEYS: { value: 'all' | Status; label: string; lamp?: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Còn', label: 'Còn hàng', lamp: 'lamp--green' },
  { value: 'Không khả dụng', label: 'Không khả dụng', lamp: 'lamp--red' },
]

function App() {
  const { toasts, notify, dismiss } = useToasts()

  const [drinks, setDrinks] = useState<Drink[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | Status>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const [form, setForm] = useState<FormState>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Drink | null>(null)
  // Các món vừa thêm/sửa: giữ đèn hổ phách tới khi người dùng thấy
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set())

  const fetchDrinks = useCallback(
    () =>
      drinkApi
        .list()
        .then((data) => {
          setDrinks(data)
          setLoadError(null)
        })
        .catch((err) => setLoadError(errorMessage(err)))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    fetchDrinks()
  }, [fetchDrinks])

  function reload() {
    setLoading(true)
    fetchDrinks()
  }

  const upsert = useCallback((drink: Drink) => {
    setDrinks((list) =>
      list.some((d) => d._id === drink._id)
        ? list.map((d) => (d._id === drink._id ? drink : d))
        : [drink, ...list],
    )
  }, [])

  const markSeen = useCallback((id: string) => {
    setFresh((set) => {
      if (!set.has(id)) return set
      const next = new Set(set)
      next.delete(id)
      return next
    })
  }, [])

  function markFresh(id: string) {
    setFresh((set) => new Set(set).add(id))
    requestAnimationFrame(() =>
      document.getElementById(`drink-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    )
  }

  const categoryCounts = useMemo<CategoryCount[]>(() => {
    const counts = new Map<string, number>()
    for (const d of drinks) counts.set(d.category, (counts.get(d.category) ?? 0) + 1)
    return [...counts]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'vi'))
  }, [drinks])

  const categories = useMemo(
    () => categoryCounts.map((c) => c.category).sort((a, b) => a.localeCompare(b, 'vi')),
    [categoryCounts],
  )

  const available = drinks.filter((d) => d.status === 'Còn').length

  const visible = useMemo(() => {
    const q = normalizeText(query.trim())
    return drinks
      .filter((d) => category === 'all' || d.category === category)
      .filter((d) => status === 'all' || d.status === status)
      .filter((d) => !q || normalizeText(`${d.name} ${d.description} ${d.category}`).includes(q))
      .sort(SORTS[sort].compare)
  }, [drinks, query, category, status, sort])

  const hasFilters = query !== '' || category !== 'all' || status !== 'all'
  const firstLoad = loading && drinks.length === 0

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setStatus('all')
  }

  async function handleSubmit(data: DrinkInput) {
    if (form?.mode === 'edit') {
      const updated = await drinkApi.update(form.drink._id, data)
      upsert(updated)
      markFresh(updated._id)
      notify('success', `Đã cập nhật "${updated.name}"`)
    } else {
      const created = await drinkApi.create(data)
      upsert(created)
      markFresh(created._id)
      notify('success', `Đã thêm "${created.name}"`)
    }
    setForm(null)
  }

  async function handleDelete() {
    if (!deleting) return
    const target = deleting
    try {
      await drinkApi.remove(target._id)
      setDrinks((list) => list.filter((d) => d._id !== target._id))
      markSeen(target._id)
      notify('success', `Đã xóa "${target.name}"`)
      setDeleting(null)
    } catch (err) {
      notify('error', errorMessage(err))
      // Đồ uống đã bị xóa ở nơi khác -> đồng bộ lại danh sách
      if (err instanceof ApiError && err.status === 404) {
        setDrinks((list) => list.filter((d) => d._id !== target._id))
        setDeleting(null)
      }
    }
  }

  const api = loadError
    ? { tone: 'red', text: 'Mất kết nối API' }
    : firstLoad
      ? { tone: 'amber', text: 'Đang kết nối API…' }
      : { tone: 'green', text: `API đã kết nối · ${drinks.length} món` }

  let content
  if (firstLoad) {
    content = (
      <div className="bank" aria-busy="true" aria-label="Đang tải">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="drink drink--ghost" />
        ))}
      </div>
    )
  } else if (loadError && drinks.length === 0) {
    content = (
      <div className="module empty">
        <span className="lamp lamp--red lamp--lg" aria-hidden="true" />
        <h2>Không tải được danh sách đồ uống</h2>
        <p>{loadError}</p>
        <button type="button" className="btn btn--primary" onClick={reload}>
          <RefreshIcon /> Thử lại
        </button>
      </div>
    )
  } else if (drinks.length === 0) {
    content = (
      <div className="module empty">
        <CupIcon width={36} height={36} className="empty__icon" />
        <h2>Menu đang trống</h2>
        <p>Thêm đồ uống đầu tiên để bắt đầu xây dựng menu.</p>
        <button type="button" className="btn btn--primary" onClick={() => setForm({ mode: 'create' })}>
          <PlusIcon /> Thêm đồ uống
        </button>
      </div>
    )
  } else if (visible.length === 0) {
    content = (
      <div className="module empty">
        <SearchIcon width={30} height={30} className="empty__icon" />
        <h2>Không có món nào khớp bộ lọc</h2>
        <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
        <button type="button" className="btn btn--ghost" onClick={clearFilters}>
          Xóa bộ lọc
        </button>
      </div>
    )
  } else {
    content = (
      <div className="bank">
        {visible.map((drink) => (
          <DrinkCard
            key={drink._id}
            drink={drink}
            fresh={fresh.has(drink._id)}
            onSeen={markSeen}
            onView={(d) => {
              markSeen(d._id)
              setViewingId(d._id)
            }}
            onEdit={(d) => {
              markSeen(d._id)
              setForm({ mode: 'edit', drink: d })
            }}
            onDelete={setDeleting}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="rail">
        <div className="container rail__inner">
          <div className="nameplate">
            <span className="nameplate__badge">
              <CupIcon width={22} height={22} />
            </span>
            <div>
              <strong>Drink Menu</strong>
              <span>Quản lý đồ uống</span>
            </div>
          </div>
          <div className="rail__right">
            <span className={`api-lamp api-lamp--${api.tone}`} role="status">
              <span className={`lamp lamp--${api.tone}`} aria-hidden="true" />
              <span className="api-lamp__text">{api.text}</span>
            </span>
            <button type="button" className="btn btn--primary" onClick={() => setForm({ mode: 'create' })}>
              <PlusIcon /> <span className="hide-sm">Thêm đồ uống</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container main">
        <div className="bento">
          <AvailabilityDial
            total={drinks.length}
            available={available}
            categories={categoryCounts.length}
            loading={firstLoad}
            status={status}
            onStatus={setStatus}
          />
          <CategoryMeters
            rows={categoryCounts}
            active={category}
            loading={firstLoad}
            onSelect={setCategory}
          />
        </div>

        <section className="module strip" aria-label="Bộ lọc">
          <label className="well search">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, mô tả, danh mục…"
              aria-label="Tìm kiếm đồ uống"
            />
          </label>
          <div className="keys" role="group" aria-label="Lọc theo trạng thái">
            {STATUS_KEYS.map((key) => (
              <button
                key={key.value}
                type="button"
                className="key"
                aria-pressed={status === key.value}
                onClick={() => setStatus(key.value)}
              >
                {key.lamp && <span className={`lamp ${key.lamp}`} aria-hidden="true" />}
                {key.label}
              </button>
            ))}
          </div>
          <label className="well select">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sắp xếp">
              {Object.entries(SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronIcon className="select__chevron" />
          </label>
          <button
            type="button"
            className="key key--icon"
            onClick={reload}
            disabled={loading}
            aria-label="Tải lại danh sách"
            title="Tải lại"
          >
            <RefreshIcon className={loading ? 'spin' : undefined} />
          </button>
        </section>

        {drinks.length > 0 && (
          <div className="result-bar">
            <span>
              Hiển thị <strong>{visible.length}</strong> / {drinks.length} đồ uống
            </span>
            {category !== 'all' && (
              <span className="chip">
                {category}
                <button type="button" onClick={() => setCategory('all')} aria-label={`Bỏ lọc ${category}`}>
                  <CloseIcon width={14} height={14} />
                </button>
              </span>
            )}
            {hasFilters && (
              <button type="button" className="link-btn" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {content}
      </main>

      <Modal
        open={form !== null}
        title={form?.mode === 'edit' ? 'Chỉnh sửa đồ uống' : 'Thêm đồ uống'}
        size="lg"
        onClose={() => setForm(null)}
      >
        {form && (
          <DrinkForm
            key={form.mode === 'edit' ? form.drink._id : 'new'}
            initial={form.mode === 'edit' ? form.drink : undefined}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>

      <Modal open={viewingId !== null} title="Chi tiết đồ uống" size="lg" onClose={() => setViewingId(null)}>
        {viewingId && (
          <DrinkDetail
            key={viewingId}
            id={viewingId}
            onLoaded={upsert}
            onEdit={(d) => {
              setViewingId(null)
              setForm({ mode: 'edit', drink: d })
            }}
            onDelete={(d) => {
              setViewingId(null)
              setDeleting(d)
            }}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} title="Xóa đồ uống" size="sm" onClose={() => setDeleting(null)}>
        {deleting && (
          <ConfirmDelete drink={deleting} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
        )}
      </Modal>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default App
