import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';

const RANGES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'custom', label: 'Khoảng ngày' },
];

export default function AdminOrdersPage() {
  useTitle('Quản lý đơn hàng');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const range = params.get('range') || 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const [draft, setDraft] = useState({ from, to });
  const [rangeError, setRangeError] = useState('');

  const query = {
    range,
    page,
    ...(range === 'custom' ? { from: from || undefined, to: to || undefined } : {}),
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'orders', query],
    queryFn: () => api.get('/admin/orders', { params: query }),
    placeholderData: keepPreviousData,
  });

  const setRange = (r) =>
    setParams(r === 'all' ? {} : r === 'custom' ? { range: r, ...draft } : { range: r });
  const applyCustom = (e) => {
    e.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setRangeError('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    setRangeError('');
    setParams({ range: 'custom', ...Object.fromEntries(Object.entries(draft).filter(([, v]) => v)) });
  };

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Đơn hàng</h1>
          <p className="muted">{data ? `${data.total} đơn · mới nhất ở trên · 20 đơn mỗi trang` : ''}</p>
        </div>
      </div>

      <div className="card card__body period-bar">
        <div className="segmented segmented--text" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <form className="range-form" onSubmit={applyCustom}>
            <label>
              Từ ngày
              <input
                className="input"
                type="date"
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              />
            </label>
            <label>
              Đến ngày
              <input
                className="input"
                type="date"
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              />
            </label>
            <Button type="submit" variant="dark">
              Lọc
            </Button>
            {rangeError && <span className="field__error">{rangeError}</span>}
          </form>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Không có đơn hàng trong khoảng thời gian này" />
      ) : (
        <section className="card" style={{ opacity: isFetching ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th className="num">SL</th>
                  <th>Thanh toán</th>
                  <th className="num">Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <td>
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="strong-link tabular"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {o.orderNumber}
                      </Link>
                      {o.discountCode && (
                        <span className="badge badge--violet badge--plain">{o.discountCode}</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-stack">
                        <strong>{o.customerName}</strong>
                        <span className="muted">{o.email}</span>
                      </div>
                    </td>
                    <td className="tabular">{formatDateTime(o.createdAt)}</td>
                    <td className="num">{o.itemCount}</td>
                    <td>{o.paymentMethod === 'card' ? 'Thẻ' : 'COD'}</td>
                    <td className="num">
                      <b>{formatPrice(o.total)}</b>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onChange={(p) => setParams({ ...Object.fromEntries(params), page: p })}
        />
      )}
    </div>
  );
}
