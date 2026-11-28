import { formatNumber, formatPrice } from '../../lib/format.js';

/** Totals block shared by cart, checkout, success page and order detail. */
export default function OrderSummary({ s, discountCode, pointsEarned, children }) {
  return (
    <dl className="summary">
      <div>
        <dt>Tạm tính</dt>
        <dd>{formatPrice(s.subtotal)}</dd>
      </div>
      {s.discountAmount > 0 && (
        <div className="summary__discount">
          <dt>
            Giảm giá{discountCode ? ` (${discountCode}` : ''}
            {s.discountPercent ? ` −${s.discountPercent}%` : ''}
            {discountCode ? ')' : ''}
          </dt>
          <dd>−{formatPrice(s.discountAmount)}</dd>
        </div>
      )}
      <div>
        <dt>Thuế VAT (10%)</dt>
        <dd>{formatPrice(s.tax)}</dd>
      </div>
      <div>
        <dt>Phí vận chuyển</dt>
        <dd>{s.shippingFee ? formatPrice(s.shippingFee) : <span className="text-success">Miễn phí</span>}</dd>
      </div>
      {s.pointsUsed > 0 && (
        <div className="summary__discount">
          <dt>Dùng {formatNumber(s.pointsUsed)} điểm</dt>
          <dd>−{formatPrice(s.pointsUsed * 1000)}</dd>
        </div>
      )}
      <div className="summary__total">
        <dt>Tổng thanh toán</dt>
        <dd className="price">{formatPrice(s.total)}</dd>
      </div>
      {(pointsEarned ?? s.pointsEarned) > 0 && (
        <p className="summary__points">
          🎁 Nhận <b>{formatNumber(pointsEarned ?? s.pointsEarned)} điểm</b> tích lũy (=
          {formatPrice((pointsEarned ?? s.pointsEarned) * 1000)})
        </p>
      )}
      {children}
    </dl>
  );
}
