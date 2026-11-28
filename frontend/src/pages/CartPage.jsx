import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../lib/format.js';
import { useTitle } from '../lib/hooks.js';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import QuantityInput from '../components/ui/QuantityInput.jsx';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/States.jsx';
import OrderSummary from '../components/order/OrderSummary.jsx';

export default function CartPage() {
  useTitle('Giỏ hàng');
  const { cart, isLoading, isError, refetch, updateQty, removeItem, busy } = useCart();

  if (isLoading) return <PageLoader />;
  if (isError) {
    return (
      <div className="container">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  const items = cart?.items || [];
  const blocked = items.some((i) => !i.available || i.exceedsStock);

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: 'Giỏ hàng' }]} />
      <h1 className="page-title">
        Giỏ hàng {items.length > 0 && <span className="muted">({cart.itemCount} sản phẩm)</span>}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Giỏ hàng đang trống"
          text="Khám phá hàng trăm sản phẩm máy tính và linh kiện chính hãng."
          action={
            <Button to="/products" variant="primary">
              Tiếp tục mua sắm
            </Button>
          }
        />
      ) : (
        <div className="cart">
          <section className="card cart__items" aria-busy={busy}>
            {items.map((i) => (
              <article
                key={`${i.productId}-${i.variantId}`}
                className={`citem ${!i.available ? 'citem--off' : ''}`}
              >
                <Link to={i.slug ? `/products/${i.slug}` : '#'} className="citem__img">
                  {i.image && <img src={i.image} alt="" width="96" height="96" loading="lazy" />}
                </Link>
                <div className="citem__info">
                  <Link to={i.slug ? `/products/${i.slug}` : '#'} className="citem__name">
                    {i.name}
                  </Link>
                  <span className="muted">{i.variantName}</span>
                  <span className="price citem__unit">{formatPrice(i.price)}</span>
                  {!i.available && (
                    <span className="citem__warn">
                      <AlertTriangle size={14} /> Sản phẩm không còn kinh doanh
                    </span>
                  )}
                  {i.exceedsStock && (
                    <span className="citem__warn">
                      <AlertTriangle size={14} />{' '}
                      {i.stock > 0
                        ? `Chỉ còn ${i.stock} sản phẩm, vui lòng giảm số lượng`
                        : 'Phiên bản đã hết hàng'}
                    </span>
                  )}
                </div>
                <div className="citem__qty">
                  {i.available && (
                    <QuantityInput
                      size="sm"
                      value={i.qty}
                      max={Math.max(i.stock, 1)}
                      onChange={(qty) =>
                        qty !== i.qty && updateQty({ productId: i.productId, variantId: i.variantId, qty })
                      }
                    />
                  )}
                  <span className="citem__line tabular">{formatPrice(i.lineTotal)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon btn--sm citem__remove"
                  aria-label={`Xóa ${i.name} khỏi giỏ`}
                  onClick={() => removeItem({ productId: i.productId, variantId: i.variantId })}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </section>

          <aside className="card card__body cart__summary">
            <h2 className="card__title">Tóm tắt đơn hàng</h2>
            <OrderSummary s={cart.summary} />
            <p className="muted small">
              Phí vận chuyển 30.000đ, miễn phí cho đơn từ 5.000.000đ. Mã giảm giá và điểm tích lũy được áp
              dụng ở bước thanh toán.
            </p>
            <Button
              to={blocked ? undefined : '/checkout'}
              variant="primary"
              size="lg"
              block
              disabled={blocked}
            >
              Tiến hành thanh toán <ArrowRight size={18} />
            </Button>
            <Button to="/products" variant="ghost" block>
              Tiếp tục mua sắm
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
