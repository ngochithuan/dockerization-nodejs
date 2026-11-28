import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/format.js';
import Stars from '../ui/Stars.jsx';

const NEW_MS = 60 * 24 * 60 * 60 * 1000;

export default function ProductCard({ product: p, layout = 'grid' }) {
  const isNew = Date.now() - new Date(p.createdAt).getTime() < NEW_MS;
  return (
    <article className={`pcard ${layout === 'list' ? 'pcard--list' : ''}`}>
      <Link to={`/products/${p.slug}`} className="pcard__media" tabIndex={-1} aria-hidden="true">
        {p.image && <img src={p.image} alt="" loading="lazy" decoding="async" width="400" height="400" />}
        <span className="pcard__flags">
          {isNew && <span className="badge badge--brand badge--plain">Mới</span>}
          {p.soldCount >= 15 && <span className="badge badge--accent badge--plain">Bán chạy</span>}
          {!p.inStock && <span className="badge badge--plain">Hết hàng</span>}
        </span>
      </Link>
      <div className="pcard__body">
        <span className="pcard__brand">{p.brand}</span>
        <h3 className="pcard__name">
          <Link to={`/products/${p.slug}`}>{p.name}</Link>
        </h3>
        <p className="pcard__desc">{p.shortDescription?.split('\n')[0]}</p>
        <div className="pcard__rating">
          <Stars value={p.avgRating} size={13} />
          <span>{p.ratingCount ? `${p.avgRating.toFixed(1)} (${p.ratingCount})` : 'Chưa có đánh giá'}</span>
        </div>
        <div className="pcard__price">
          {p.minPrice !== p.maxPrice && <small>Từ</small>}
          <span className="price">{formatPrice(p.minPrice)}</span>
        </div>
        {p.soldCount > 0 && <span className="pcard__sold">Đã bán {p.soldCount}</span>}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="pcard" aria-hidden="true">
      <div className="pcard__media skeleton" />
      <div className="pcard__body">
        <div className="skeleton" style={{ height: 10, width: '40%' }} />
        <div className="skeleton" style={{ height: 14, width: '90%', marginTop: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '70%', marginTop: 6 }} />
        <div className="skeleton" style={{ height: 18, width: '50%', marginTop: 14 }} />
      </div>
    </div>
  );
}

export function ProductGrid({ items, loading, count = 8, layout = 'grid' }) {
  return (
    <div className={layout === 'list' ? 'plist' : 'pgrid'}>
      {loading
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : items.map((p) => <ProductCard key={p.id} product={p} layout={layout} />)}
    </div>
  );
}
