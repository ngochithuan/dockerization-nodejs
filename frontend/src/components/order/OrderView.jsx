import { CreditCard, MapPin, Package, Wallet } from 'lucide-react';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { StatusBadge, ORDER_STATUS } from '../ui/Badge.jsx';
import OrderSummary from './OrderSummary.jsx';

const PAYMENT = { cod: 'Thanh toán khi nhận hàng (COD)', card: 'Thẻ tín dụng / ghi nợ' };
const PAYMENT_STATUS = { paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán', refunded: 'Đã hoàn tiền' };

export const formatAddress = (a) => [a.street, a.ward, a.district, a.city].filter(Boolean).join(', ');

export function OrderItems({ items }) {
  return (
    <ul className="oitems">
      {items.map((i) => (
        <li key={`${i.productId}-${i.variantId}`} className="oitem">
          {i.image && <img src={i.image} alt="" loading="lazy" width="64" height="64" />}
          <div className="oitem__info">
            <strong>{i.productName}</strong>
            <span className="muted">{i.variantName}</span>
            <span className="muted tabular">
              {formatPrice(i.unitPrice)} × {i.qty}
            </span>
          </div>
          <span className="oitem__total tabular">{formatPrice(i.lineTotal ?? i.unitPrice * i.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

export function StatusHistory({ history }) {
  const rows = [...history].sort((a, b) => new Date(b.at) - new Date(a.at)); // newest first
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Trạng thái</th>
            <th>Thời gian cập nhật</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h, i) => (
            <tr key={`${h.status}-${h.at}`} className={i === 0 ? 'row--current' : ''}>
              <td>
                <StatusBadge status={h.status} />
              </td>
              <td className="tabular">{formatDateTime(h.at)}</td>
              <td className="muted">{h.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusTracker({ status }) {
  const steps = ['pending', 'confirmed', 'shipping', 'delivered'];
  if (status === 'cancelled') return <div className="tracker tracker--cancelled">Đơn hàng đã bị hủy</div>;
  const idx = steps.indexOf(status);
  return (
    <ol className="tracker">
      {steps.map((s, i) => (
        <li key={s} className={i <= idx ? 'done' : ''}>
          <span className="tracker__dot">{i + 1}</span>
          <span>{ORDER_STATUS[s].label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Full order information: used by the success page and the customer order detail page. */
export default function OrderView({ order, children }) {
  const a = order.shippingAddress;
  return (
    <div className="oview">
      <div className="oview__meta card card__body">
        <div>
          <span className="muted">Mã đơn hàng</span>
          <strong className="tabular">{order.orderNumber}</strong>
        </div>
        <div>
          <span className="muted">Ngày đặt</span>
          <strong className="tabular">{formatDateTime(order.createdAt)}</strong>
        </div>
        <div>
          <span className="muted">Trạng thái</span>
          <StatusBadge status={order.status} />
        </div>
        <div>
          <span className="muted">Tổng tiền</span>
          <strong className="price">{formatPrice(order.total)}</strong>
        </div>
      </div>

      <StatusTracker status={order.status} />

      <div className="oview__grid">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title row">
              <Package size={18} /> Sản phẩm ({order.items.reduce((s, i) => s + i.qty, 0)})
            </h2>
          </div>
          <div className="card__body">
            <OrderItems items={order.items} />
            <OrderSummary s={order} discountCode={order.discountCode} pointsEarned={order.pointsEarned} />
          </div>
        </section>

        <div className="stack">
          <section className="card card__body">
            <h2 className="card__title row">
              <MapPin size={18} /> Địa chỉ giao hàng
            </h2>
            <p className="oview__addr">
              <strong>{a.recipientName}</strong> · {a.phone}
              <br />
              {formatAddress(a)}
            </p>
            <p className="muted">Email: {order.email}</p>
          </section>
          <section className="card card__body">
            <h2 className="card__title row">
              {order.paymentMethod === 'card' ? <CreditCard size={18} /> : <Wallet size={18} />} Thanh toán
            </h2>
            <p>{PAYMENT[order.paymentMethod]}</p>
            <p className="muted">{PAYMENT_STATUS[order.paymentStatus]}</p>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
