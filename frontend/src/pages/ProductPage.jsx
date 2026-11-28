import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, PackageX, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import { useCart } from '../context/CartContext.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import Stars from '../components/ui/Stars.jsx';
import QuantityInput from '../components/ui/QuantityInput.jsx';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/States.jsx';
import { ProductGrid } from '../components/product/ProductCard.jsx';
import Reviews from '../components/product/Reviews.jsx';

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
  }, [images]);
  return (
    <div className="gallery">
      <div className="gallery__main">
        <img src={images[active]} alt={`${name} — ảnh ${active + 1}`} width="800" height="800" />
      </div>
      <div className="gallery__thumbs" role="tablist" aria-label="Ảnh sản phẩm">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? 'active' : ''}
            onClick={() => setActive(i)}
          >
            <img src={src} alt="" loading="lazy" width="120" height="120" />
          </button>
        ))}
      </div>
    </div>
  );
}

function stockLabel(stock) {
  if (stock <= 0) return { text: 'Hết hàng', tone: 'out' };
  if (stock <= 5) return { text: `Chỉ còn ${stock} sản phẩm`, tone: 'low' };
  return { text: `Còn ${stock} sản phẩm`, tone: 'ok' };
}

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, adding } = useCart();
  const {
    data: p,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`),
  });
  const [variantId, setVariantId] = useState(null);
  const [qty, setQty] = useState(1);
  useTitle(p?.name);

  useEffect(() => {
    if (p) setVariantId((p.variants.find((v) => v.stock > 0) || p.variants[0]).id);
  }, [p]);

  const variant = p?.variants.find((v) => v.id === variantId);
  useEffect(() => {
    setQty(1);
  }, [variantId]);

  if (isLoading) return <PageLoader />;
  if (isError) {
    return (
      <div className="container">
        {error.status === 404 ? (
          <EmptyState
            icon={PackageX}
            title="Sản phẩm không tồn tại"
            text="Sản phẩm có thể đã ngừng kinh doanh."
            action={
              <Button to="/products" variant="primary">
                Xem sản phẩm khác
              </Button>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )}
      </div>
    );
  }

  const add = async (goToCart) => {
    try {
      await addItem({ productId: p.id, variantId, qty });
      if (goToCart) navigate('/cart');
      else
        toast.success(
          <span>
            Đã thêm <b>{qty}</b> × {p.name} vào giỏ. <Link to="/cart">Xem giỏ</Link>
          </span>,
        );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const stock = variant ? stockLabel(variant.stock) : null;
  const lines = p.shortDescription.split('\n').filter(Boolean);

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { label: 'Sản phẩm', to: '/products' },
          { label: p.category.name, to: `/products?category=${p.category.slug}` },
          { label: p.name },
        ]}
      />

      <div className="pdp">
        <Gallery images={p.images} name={p.name} />

        <div className="pdp__info">
          <Link to={`/products?brand=${encodeURIComponent(p.brand)}`} className="pdp__brand">
            {p.brand}
          </Link>
          <h1 className="pdp__name">{p.name}</h1>
          <div className="pdp__meta">
            <a href="#reviews" className="row" style={{ gap: 6 }}>
              <Stars value={p.avgRating} />
              <span>
                {p.avgRating.toFixed(1)} · {p.ratingCount} đánh giá
              </span>
            </a>
            <span className="dot" />
            <span>Đã bán {p.soldCount}</span>
          </div>

          <div className="pdp__price">
            <span className="price">{formatPrice(variant?.price ?? p.minPrice)}</span>
            {p.minPrice !== p.maxPrice && (
              <span className="muted">
                Giá từ {formatPrice(p.minPrice)} – {formatPrice(p.maxPrice)} tùy phiên bản
              </span>
            )}
          </div>

          <div className="pdp__block">
            <h2 className="pdp__label">Chọn phiên bản ({p.variants.length})</h2>
            <div className="variants">
              {p.variants.map((v) => {
                const s = stockLabel(v.stock);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`variant ${v.id === variantId ? 'active' : ''} ${v.stock <= 0 ? 'variant--out' : ''}`}
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={v.id === variantId}
                  >
                    <span className="variant__name">{v.name}</span>
                    <span className="variant__price">{formatPrice(v.price)}</span>
                    <span className={`variant__stock variant__stock--${s.tone}`}>{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pdp__block">
            <h2 className="pdp__label">Số lượng</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <QuantityInput
                value={qty}
                onChange={setQty}
                max={Math.max(1, variant?.stock || 1)}
                disabled={!variant || variant.stock <= 0}
              />
              {stock && <span className={`stock-note stock-note--${stock.tone}`}>{stock.text}</span>}
            </div>
          </div>

          <div className="pdp__actions">
            <Button
              variant="primary"
              size="lg"
              icon={<ShoppingCart size={18} />}
              loading={adding}
              disabled={!variant || variant.stock <= 0}
              onClick={() => add(false)}
            >
              Thêm vào giỏ
            </Button>
            <Button
              variant="accent"
              size="lg"
              icon={<Zap size={18} />}
              disabled={!variant || variant.stock <= 0 || adding}
              onClick={() => add(true)}
            >
              Mua ngay
            </Button>
          </div>

          <ul className="pdp__perks">
            <li>
              <Truck size={16} /> Miễn phí giao hàng cho đơn từ 5.000.000đ
            </li>
            <li>
              <ShieldCheck size={16} /> Hàng chính hãng, bảo hành theo nhà sản xuất
            </li>
            <li>
              <CheckCircle2 size={16} /> Tích {Math.floor(((variant?.price || p.minPrice) * 0.1) / 1000)} điểm
              cho sản phẩm này
            </li>
          </ul>
        </div>
      </div>

      <div className="pdp__details">
        <section className="card card__body">
          <h2 className="pdp__section-title">Mô tả sản phẩm</h2>
          <div className="pdp__desc">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          {p.tags.length > 0 && (
            <div className="chips" style={{ marginTop: 16 }}>
              {p.tags.map((t) => (
                <Link key={t} to={`/products?tag=${t}`} className="chip">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card card__body">
          <h2 className="pdp__section-title">Thông số kỹ thuật</h2>
          <table className="specs">
            <tbody>
              <tr>
                <th>Thương hiệu</th>
                <td>{p.brand}</td>
              </tr>
              {p.specs.map((s) => (
                <tr key={s.label}>
                  <th>{s.label}</th>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <Reviews productId={p.id} slug={slug} />

      {p.related.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Sản phẩm cùng danh mục</h2>
          </div>
          <ProductGrid items={p.related} />
        </section>
      )}
    </div>
  );
}
