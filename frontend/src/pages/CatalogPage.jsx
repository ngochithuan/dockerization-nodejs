import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SearchX, SlidersHorizontal, Star, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { CATEGORIES } from '../lib/categories.js';
import { formatPrice } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/States.jsx';
import { ProductGrid } from '../components/product/ProductCard.jsx';

const SORTS = [
  { value: 'relevance', label: 'Liên quan nhất', searchOnly: true },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best-selling', label: 'Bán chạy nhất' },
  { value: 'top-rated', label: 'Đánh giá cao nhất' },
  { value: 'price-asc', label: 'Giá: thấp → cao' },
  { value: 'price-desc', label: 'Giá: cao → thấp' },
  { value: 'name-asc', label: 'Tên: A → Z' },
  { value: 'name-desc', label: 'Tên: Z → A' },
];

const PRICE_PRESETS = [
  [0, 5_000_000],
  [5_000_000, 15_000_000],
  [15_000_000, 30_000_000],
  [30_000_000, null],
];

const tr = (n) => `${n / 1_000_000} triệu`;
const presetLabel = (a, b) => (!a ? `Dưới ${tr(b)}` : !b ? `Trên ${tr(a)}` : `${a / 1_000_000} – ${tr(b)}`);

function Filters({ params, update, brands }) {
  const category = params.get('category') || '';
  const selectedBrands = params.getAll('brand');
  const rating = params.get('rating') || '';
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setMin(params.get('minPrice') || '');
    setMax(params.get('maxPrice') || '');
  }, [params]);

  const toggleBrand = (b) => {
    const next = selectedBrands.includes(b) ? selectedBrands.filter((x) => x !== b) : [...selectedBrands, b];
    update({ brand: next });
  };

  const applyPrice = (e) => {
    e?.preventDefault();
    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      setPriceError('Giá tối thiểu phải nhỏ hơn giá tối đa');
      return;
    }
    setPriceError('');
    update({ minPrice: min, maxPrice: max });
  };

  // Brands of the current result set, plus any selected brand that is filtered out.
  const brandList = [...brands];
  selectedBrands.forEach(
    (b) => !brandList.some((x) => x.name === b) && brandList.push({ name: b, count: 0 }),
  );

  return (
    <div className="filters">
      <div className="filter">
        <h3 className="filter__title">Danh mục</h3>
        <div className="filter__options">
          <label className="check">
            <input
              type="radio"
              name="category"
              checked={!category}
              onChange={() => update({ category: '', brand: [] })}
            />
            Tất cả danh mục
          </label>
          {CATEGORIES.map((c) => (
            <label key={c.slug} className="check">
              <input
                type="radio"
                name="category"
                checked={category === c.slug}
                onChange={() => update({ category: c.slug, brand: [] })}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter">
        <h3 className="filter__title">Thương hiệu</h3>
        <div className="filter__options filter__options--scroll">
          {brandList.length === 0 && <span className="muted">Không có thương hiệu</span>}
          {brandList.map((b) => (
            <label key={b.name} className="check">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b.name)}
                onChange={() => toggleBrand(b.name)}
              />
              {b.name}
              <span className="filter__count">{b.count}</span>
            </label>
          ))}
        </div>
      </div>

      <form className="filter" onSubmit={applyPrice}>
        <h3 className="filter__title">Khoảng giá (đ)</h3>
        <div className="price-range">
          <input
            className="input"
            type="number"
            min="0"
            step="100000"
            placeholder="Tối thiểu"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Giá tối thiểu"
          />
          <span>–</span>
          <input
            className="input"
            type="number"
            min="0"
            step="100000"
            placeholder="Tối đa"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Giá tối đa"
          />
        </div>
        {priceError && <span className="field__error">{priceError}</span>}
        <div className="chips">
          {PRICE_PRESETS.map(([a, b]) => (
            <button
              key={a}
              type="button"
              className="chip"
              onClick={() => update({ minPrice: a || '', maxPrice: b || '' })}
            >
              {presetLabel(a, b)}
            </button>
          ))}
        </div>
        <Button type="submit" variant="dark" size="sm" block>
          Áp dụng khoảng giá
        </Button>
      </form>

      <div className="filter">
        <h3 className="filter__title">Đánh giá</h3>
        <div className="filter__options">
          {['', '4', '3', '2'].map((r) => (
            <label key={r || 'all'} className="check">
              <input
                type="radio"
                name="rating"
                checked={rating === r}
                onChange={() => update({ rating: r })}
              />
              {r ? (
                <span className="row" style={{ gap: 4 }}>
                  Từ {r} <Star size={13} fill="var(--star)" strokeWidth={0} /> trở lên
                </span>
              ) : (
                'Tất cả'
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [layout, setLayout] = useState(() => localStorage.getItem('catalogLayout') || 'grid');

  const q = params.get('q') || '';
  const category = CATEGORIES.find((c) => c.slug === params.get('category'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') || (q ? 'relevance' : 'newest');
  useTitle(q ? `Tìm "${q}"` : category?.name || 'Tất cả sản phẩm');

  const query = {
    q,
    category: params.get('category') || undefined,
    tag: params.get('tag') || undefined,
    brand: params.getAll('brand'),
    minPrice: params.get('minPrice') || undefined,
    maxPrice: params.get('maxPrice') || undefined,
    rating: params.get('rating') || undefined,
    sort,
    page,
    limit: 12,
  };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['products', query],
    queryFn: () => api.get('/products', { params: query }),
    placeholderData: keepPreviousData,
  });

  /** Merge changes into the URL (single source of truth); any filter change resets to page 1. */
  const update = (changes, { keepPage } = {}) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      next.delete(k);
      if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
      else if (v !== '' && v !== undefined && v !== null) next.set(k, v);
    }
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const goPage = (p) => {
    update({ page: p }, { keepPage: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setView = (v) => {
    setLayout(v);
    localStorage.setItem('catalogLayout', v);
  };

  const chips = [
    q && { key: 'q', label: `"${q}"`, clear: { q: '' } },
    category && { key: 'cat', label: category.name, clear: { category: '', brand: [] } },
    params.get('tag') && { key: 'tag', label: `#${params.get('tag')}`, clear: { tag: '' } },
    ...params.getAll('brand').map((b) => ({
      key: `b-${b}`,
      label: b,
      clear: { brand: params.getAll('brand').filter((x) => x !== b) },
    })),
    (params.get('minPrice') || params.get('maxPrice')) && {
      key: 'price',
      label: `${params.get('minPrice') ? formatPrice(params.get('minPrice')) : '0đ'} – ${params.get('maxPrice') ? formatPrice(params.get('maxPrice')) : '∞'}`,
      clear: { minPrice: '', maxPrice: '' },
    },
    params.get('rating') && { key: 'rating', label: `Từ ${params.get('rating')} sao`, clear: { rating: '' } },
  ].filter(Boolean);

  const title = q ? `Kết quả cho "${q}"` : category ? category.name : 'Tất cả sản phẩm';
  const filters = <Filters params={params} update={update} brands={data?.facets?.brands || []} />;

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { label: 'Sản phẩm', to: '/products' },
          ...(category ? [{ label: category.name }] : []),
          ...(q ? [{ label: `Tìm kiếm` }] : []),
        ]}
      />
      <div className="catalog">
        <aside className="catalog__sidebar" aria-label="Bộ lọc">
          {filters}
        </aside>

        <section className="catalog__main">
          <div className="catalog__head">
            <div>
              <h1 className="catalog__title">{title}</h1>
              <p className="muted">
                {data ? `${data.total} sản phẩm` : 'Đang tải…'}
                {data?.engine === 'elasticsearch' && q && <span className="engine-tag">Elasticsearch</span>}
              </p>
            </div>
            <div className="toolbar">
              <Button
                className="show-md"
                icon={<SlidersHorizontal size={16} />}
                onClick={() => setFiltersOpen(true)}
              >
                Bộ lọc{chips.length ? ` (${chips.length})` : ''}
              </Button>
              <label className="toolbar__sort">
                <span className="hide-sm">Sắp xếp</span>
                <select className="select" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.filter((s) => !s.searchOnly || q).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="segmented" role="group" aria-label="Kiểu hiển thị">
                <button
                  type="button"
                  aria-pressed={layout === 'grid'}
                  onClick={() => setView('grid')}
                  aria-label="Dạng lưới"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  aria-pressed={layout === 'list'}
                  onClick={() => setView('list')}
                  aria-label="Dạng danh sách"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="chips chips--active">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="chip chip--active"
                  onClick={() => update(c.clear)}
                >
                  {c.label} <X size={13} />
                </button>
              ))}
              <button
                type="button"
                className="chip chip--clear"
                onClick={() => setParams(new URLSearchParams())}
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !isLoading && data?.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Không tìm thấy sản phẩm phù hợp"
              text="Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc."
              action={
                <Button variant="primary" onClick={() => setParams(new URLSearchParams())}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <div style={{ opacity: isFetching && !isLoading ? 0.6 : 1, transition: 'opacity .15s' }}>
              <ProductGrid items={data?.items || []} loading={isLoading} count={12} layout={layout} />
            </div>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={goPage}
            />
          )}
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Bộ lọc"
        footer={
          <Button variant="primary" block onClick={() => setFiltersOpen(false)}>
            Xem {data?.total ?? ''} sản phẩm
          </Button>
        }
      >
        {filters}
      </Drawer>
    </div>
  );
}
