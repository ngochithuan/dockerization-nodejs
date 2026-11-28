import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, History, Package, RefreshCw, User } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { ORDER_STATUS, StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import OrderSummary from '../../components/order/OrderSummary.jsx';
import { formatAddress, StatusHistory, StatusTracker } from '../../components/order/OrderView.jsx';

const PAYMENT_STATUS = { paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán', refunded: 'Đã hoàn tiền' };

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api.get(`/admin/orders/${id}`),
  });
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  useTitle(data ? `Đơn ${data.order.orderNumber}` : 'Đơn hàng');

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const { order: o, allowedNext } = data;

  const update = async (e) => {
    e.preventDefault();
    if (!status) return;
    if (status === 'cancelled' && !window.confirm('Hủy đơn hàng? Tồn kho và điểm tích lũy sẽ được hoàn lại.'))
      return;
    setSaving(true);
    try {
      const res = await api.patch(`/admin/orders/${id}/status`, { status, note: note.trim(), notify });
      qc.setQueryData(['admin', 'order', id], res);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setStatus('');
      setNote('');
      toast.success(
        `Đã chuyển sang "${ORDER_STATUS[status].label}"${notify ? ' và gửi email cho khách' : ''}`,
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const items = o.items.map((i) => ({ ...i, productId: i.product, variantId: i.variant }));

  return (
    <div className="stack-lg">
      <Link to="/admin/orders" className="link-arrow">
        <ArrowLeft size={16} /> Danh sách đơn hàng
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title row">
            Đơn #{o.orderNumber} <StatusBadge status={o.status} />
          </h1>
          <p className="muted">Đặt lúc {formatDateTime(o.createdAt)}</p>
        </div>
      </div>

      <StatusTracker status={o.status} />

      <div className="form-cols">
        <div className="stack-lg">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title row">
                <Package size={18} /> Sản phẩm
              </h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th className="num">Đơn giá</th>
                    <th className="num">SL</th>
                    <th className="num">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={`${i.productId}-${i.variantId}`}>
                      <td>
                        <div className="cell-product">
                          {i.image && <img src={i.image} alt="" width="44" height="44" />}
                          <div>
                            <strong>{i.productName}</strong>
                            <span className="muted">{i.variantName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="num">{formatPrice(i.unitPrice)}</td>
                      <td className="num">{i.qty}</td>
                      <td className="num">{formatPrice(i.unitPrice * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card__body">
              <OrderSummary s={o} discountCode={o.discountCode} pointsEarned={o.pointsEarned} />
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title row">
                <History size={18} /> Lịch sử trạng thái
              </h2>
            </div>
            <StatusHistory history={o.statusHistory} />
          </section>
        </div>

        <div className="stack-lg">
          <form className="card card__body stack" onSubmit={update}>
            <h2 className="card__title row">
              <RefreshCw size={18} /> Cập nhật trạng thái
            </h2>
            {allowedNext.length === 0 ? (
              <p className="muted">Đơn hàng đã ở trạng thái cuối, không thể thay đổi.</p>
            ) : (
              <>
                <Field
                  as="select"
                  label="Trạng thái mới"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">— Chọn trạng thái —</option>
                  {allowedNext.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS[s].label}
                    </option>
                  ))}
                </Field>
                <Field
                  label="Ghi chú (tùy chọn)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
                <label className="check">
                  <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                  Gửi email thông báo cho khách hàng
                </label>
                <Button type="submit" variant="primary" loading={saving} disabled={!status}>
                  Cập nhật
                </Button>
              </>
            )}
          </form>

          <section className="card card__body stack">
            <h2 className="card__title row">
              <User size={18} /> Người mua
            </h2>
            <dl className="info-list">
              <dt>Họ tên</dt>
              <dd>
                <Link to={`/admin/users/${o.user}`} className="strong-link">
                  {o.customerName}
                </Link>
              </dd>
              <dt>Email</dt>
              <dd>{o.email}</dd>
              <dt>Thời gian mua</dt>
              <dd className="tabular">{formatDateTime(o.createdAt)}</dd>
              <dt>Tổng tiền</dt>
              <dd className="price">{formatPrice(o.total)}</dd>
              <dt>Mã giảm giá</dt>
              <dd>
                {o.discountCode ? (
                  <>
                    <span className="badge badge--violet badge--plain">{o.discountCode}</span> −
                    {o.discountPercent}% (−
                    {formatPrice(o.discountAmount)})
                  </>
                ) : (
                  'Không áp dụng'
                )}
              </dd>
              <dt>Điểm sử dụng / tích</dt>
              <dd>
                {o.pointsUsed} / {o.pointsEarned}
              </dd>
              <dt>Thanh toán</dt>
              <dd>
                {o.paymentMethod === 'card' ? 'Thẻ' : 'COD'} · {PAYMENT_STATUS[o.paymentStatus]}
              </dd>
              <dt>Giao đến</dt>
              <dd>
                {o.shippingAddress.recipientName} · {o.shippingAddress.phone}
                <br />
                {formatAddress(o.shippingAddress)}
              </dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
