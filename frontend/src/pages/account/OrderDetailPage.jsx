import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History, PackageX } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import OrderView, { StatusHistory } from '../../components/order/OrderView.jsx';

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  useTitle(`Đơn hàng ${orderNumber}`);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'detail', orderNumber],
    queryFn: () => api.get(`/orders/${orderNumber}`),
  });

  if (isLoading) return <PageLoader />;
  if (isError) {
    return error.status === 404 || error.status === 400 ? (
      <EmptyState
        icon={PackageX}
        title="Không tìm thấy đơn hàng"
        action={<Button to="/account/orders">Về danh sách đơn hàng</Button>}
      />
    ) : (
      <ErrorState error={error} onRetry={refetch} />
    );
  }

  return (
    <div className="stack">
      <Link to="/account/orders" className="link-arrow">
        <ArrowLeft size={16} /> Tất cả đơn hàng
      </Link>
      <h1 className="page-title">Chi tiết đơn hàng #{data.order.orderNumber}</h1>
      <OrderView order={data.order} />
      <section className="card">
        <div className="card__header">
          <h2 className="card__title row">
            <History size={18} /> Lịch sử trạng thái (mới nhất ở trên)
          </h2>
        </div>
        <StatusHistory history={data.order.statusHistory} />
      </section>
    </div>
  );
}
