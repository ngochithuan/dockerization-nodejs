import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgePercent, Flame, ShieldCheck, Sparkles, Truck, UserCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { CATEGORIES, categoryIcon } from '../lib/categories.js';
import { useTitle } from '../lib/hooks.js';
import Button from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { ProductGrid } from '../components/product/ProductCard.jsx';

const PERKS = [
  { icon: Truck, title: 'Giao hàng toàn quốc', text: 'Miễn phí cho đơn từ 5.000.000đ' },
  { icon: ShieldCheck, title: 'Chính hãng 100%', text: 'Bảo hành theo nhà sản xuất' },
  { icon: BadgePercent, title: 'Tích điểm 10%', text: '1 điểm = 1.000đ, dùng ngay đơn sau' },
  { icon: UserCheck, title: 'Không cần tài khoản', text: 'Đặt hàng nhanh chỉ với email' },
];

function Section({ eyebrow, title, icon: Icon, to, items, loading }) {
  return (
    <section className="container section">
      <div className="section__head">
        <div>
          <span className="section__eyebrow">{eyebrow}</span>
          <h2 className="section__title row" style={{ gap: 10 }}>
            {Icon && <Icon size={24} className="section__icon" />}
            {title}
          </h2>
        </div>
        <Link to={to} className="link-arrow">
          Xem tất cả <ArrowRight size={16} />
        </Link>
      </div>
      <ProductGrid items={items || []} loading={loading} count={4} />
    </section>
  );
}

export default function HomePage() {
  useTitle();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: () => api.get('/home'),
  });

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">Build · Upgrade · Game</span>
            <h1 className="hero__title">
              Máy tính và linh kiện <span>chính hãng</span> cho mọi cấu hình
            </h1>
            <p className="hero__text">
              Laptop, PC, màn hình và đầy đủ linh kiện từ Intel, AMD, NVIDIA, ASUS, MSI, Samsung… Giá minh
              bạch, tồn kho theo từng phiên bản.
            </p>
            <div className="hero__cta">
              <Button to="/products" variant="primary" size="lg">
                Mua sắm ngay <ArrowRight size={18} />
              </Button>
              <Button to="/products?category=gpu" size="lg" className="hero__ghost">
                Card đồ họa
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container perks" aria-label="Cam kết">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="perk">
            <span className="perk__icon">
              <Icon size={20} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="container section">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Danh mục</span>
            <h2 className="section__title">Mua theo danh mục</h2>
          </div>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map(({ slug, name, icon: Icon }) => (
            <Link key={slug} to={`/products?category=${slug}`} className="cat-tile">
              <span className="cat-tile__icon">
                <Icon size={26} strokeWidth={1.6} />
              </span>
              <span className="cat-tile__name">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {isError ? (
        <div className="container">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      ) : (
        <>
          <Section
            eyebrow="Vừa cập bến"
            title="Sản phẩm mới"
            icon={Sparkles}
            to="/products?sort=newest"
            items={data?.newProducts}
            loading={isLoading}
          />
          <Section
            eyebrow="Được tin chọn"
            title="Bán chạy nhất"
            icon={Flame}
            to="/products?sort=best-selling"
            items={data?.bestSellers}
            loading={isLoading}
          />
          {(data?.categories || []).map((c) => (
            <Section
              key={c.slug}
              eyebrow="Danh mục nổi bật"
              title={c.name}
              icon={categoryIcon(c.slug)}
              to={`/products?category=${c.slug}`}
              items={c.items}
            />
          ))}
        </>
      )}
    </>
  );
}
