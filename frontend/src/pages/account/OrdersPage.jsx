import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';

export default function OrdersPage() {
  useTitle('Đơn hàng của tôi');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => api.get('/orders', { params: { page, limit: 8 } }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="stack">
      <h1 className="page-title">
        Đơn hàng của tôi <span className="muted">({data.total})</span>
      </h1>
      {data.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Bạn chưa có đơn hàng nào"
          action={
            <Button to="/products" variant="primary">
              Mua sắm ngay
            </Button>
          }
        />
      ) : (
        <div className="olist">
          {data.items.map((o) => (
            <Link key={o.orderNumber} to={`/account/orders/${o.orderNumber}`} className="ocard card">
              <div className="ocard__head">
                <div>
                  <strong className="tabular">#{o.orderNumber}</strong>
                  <span className="muted tabular">{formatDateTime(o.createdAt)}</span>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="ocard__items">
                {o.items.map((i) => (
                  <li key={`${i.productId}-${i.variantId}`}>
                    {i.image && <img src={i.image} alt="" width="44" height="44" loading="lazy" />}
                    <span>
                      {i.productName} <span className="muted">({i.variantName})</span>
                    </span>
                    <b className="tabular">× {i.qty}</b>
                  </li>
                ))}
              </ul>
              <div className="ocard__foot">
                <span>
                  Tổng tiền: <b className="price">{formatPrice(o.total)}</b>
                </span>
                <span className="link-arrow">
                  Chi tiết <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        pageSize={data.pageSize}
        onChange={(p) => setParams({ page: p })}
      />
    </div>
  );
}
