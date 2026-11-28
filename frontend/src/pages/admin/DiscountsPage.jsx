import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Plus, TicketPercent } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';

// Discount management = view the list (with the orders that used each code) + create. Nothing else.
export default function DiscountsPage() {
  useTitle('Mã giảm giá');
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'discounts'],
    queryFn: () => api.get('/admin/discounts'),
  });
  const [form, setForm] = useState({ code: '', percent: '10', usageLimit: '10' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[A-Z0-9]{5}$/.test(form.code)) errs.code = 'Mã gồm đúng 5 ký tự chữ hoặc số';
    const pct = Number(form.percent);
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) errs.percent = 'Từ 1% đến 90%';
    const lim = Number(form.usageLimit);
    if (!Number.isInteger(lim) || lim < 1 || lim > 10) errs.usageLimit = 'Từ 1 đến 10 lượt';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post('/admin/discounts', { code: form.code, percent: pct, usageLimit: lim });
      toast.success(`Đã tạo mã ${form.code}`);
      setForm({ ...form, code: '' });
      qc.invalidateQueries({ queryKey: ['admin', 'discounts'] });
    } catch (err) {
      setErrors(err.fieldErrors());
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const randomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    setForm({
      ...form,
      code: Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''),
    });
  };

  return (
    <div className="stack-lg">
      <div>
        <h1 className="page-title">Mã giảm giá</h1>
        <p className="muted">
          Mã gồm 5 ký tự, giảm theo % tiền hàng, không có hạn sử dụng, tối đa 10 lượt dùng.
        </p>
      </div>

      <form className="card card__body discount-form" onSubmit={create} noValidate>
        <Field
          label="Mã (5 ký tự)"
          value={form.code}
          maxLength={5}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
          error={errors.code}
          placeholder="VD: SALE5"
        />
        <Button onClick={randomCode} className="discount-form__gen">
          Tạo ngẫu nhiên
        </Button>
        <Field
          label="Giảm (%)"
          type="number"
          min="1"
          max="90"
          value={form.percent}
          onChange={(e) => setForm({ ...form, percent: e.target.value })}
          error={errors.percent}
        />
        <Field
          label="Số lượt tối đa (1–10)"
          type="number"
          min="1"
          max="10"
          value={form.usageLimit}
          onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
          error={errors.usageLimit}
        />
        <Button type="submit" variant="primary" icon={<Plus size={16} />} loading={saving}>
          Tạo mã
        </Button>
      </form>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Chưa có mã giảm giá" />
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th />
                  <th>Mã</th>
                  <th>Thời gian tạo</th>
                  <th className="num">Giảm</th>
                  <th>Đã dùng / Giới hạn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d) => {
                  const expanded = open === d.id;
                  const full = d.usedCount >= d.usageLimit;
                  return (
                    <Fragment key={d.id}>
                      <tr className="table--clickable" onClick={() => setOpen(expanded ? null : d.id)}>
                        <td>{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                        <td>
                          <code className="code">{d.code}</code>
                        </td>
                        <td className="tabular">{formatDateTime(d.createdAt)}</td>
                        <td className="num">
                          <b>{d.percent}%</b>
                        </td>
                        <td>
                          <div className="usage">
                            <div className="usage__bar">
                              <span
                                style={{ width: `${(d.usedCount / d.usageLimit) * 100}%` }}
                                className={full ? 'full' : ''}
                              />
                            </div>
                            <span className="tabular">
                              {d.usedCount} / {d.usageLimit}
                            </span>
                          </div>
                        </td>
                        <td>
                          {full ? (
                            <span className="badge badge--danger">Hết lượt</span>
                          ) : d.usedCount > 0 ? (
                            <span className="badge badge--warning">Đang dùng</span>
                          ) : (
                            <span className="badge badge--success">Chưa dùng</span>
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="subrow">
                          <td />
                          <td colSpan={5}>
                            {d.orders.length === 0 ? (
                              <p className="muted">Chưa có đơn hàng nào dùng mã này.</p>
                            ) : (
                              <table className="table table--inner">
                                <thead>
                                  <tr>
                                    <th>Đơn hàng</th>
                                    <th>Khách hàng</th>
                                    <th>Ngày</th>
                                    <th className="num">Giảm</th>
                                    <th className="num">Tổng tiền</th>
                                    <th>Trạng thái</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.orders.map((o) => (
                                    <tr key={o.id}>
                                      <td>
                                        <Link to={`/admin/orders/${o.id}`} className="strong-link tabular">
                                          {o.orderNumber}
                                        </Link>
                                      </td>
                                      <td>{o.customerName}</td>
                                      <td className="tabular">{formatDateTime(o.createdAt)}</td>
                                      <td className="num">−{formatPrice(o.discountAmount)}</td>
                                      <td className="num">{formatPrice(o.total)}</td>
                                      <td>
                                        <StatusBadge status={o.status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
