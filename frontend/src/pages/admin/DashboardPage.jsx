import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { DollarSign, ShoppingBag, UserPlus, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import { C, PALETTE, compactVnd, countAxis, moneyAxis, moneyTooltip } from '../../lib/charts.js';
import { formatNumber, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { ORDER_STATUS } from '../../components/ui/Badge.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Kpi from '../../components/admin/Kpi.jsx';

export default function DashboardPage() {
  useTitle('Tổng quan quản trị');
  const {
    data: d,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
  });
  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const statusKeys = Object.keys(ORDER_STATUS).filter((k) => d.ordersByStatus[k]);
  const statusColors = {
    pending: '#f5a524',
    confirmed: '#0c6ba8',
    shipping: '#6b3fd4',
    delivered: '#12805c',
    cancelled: '#c9302c',
  };

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="muted">Hiệu quả kinh doanh của cửa hàng (không tính đơn đã hủy).</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi icon={Users} label="Tổng khách hàng" value={formatNumber(d.totalUsers)} />
        <Kpi
          icon={UserPlus}
          tone="success"
          label="Khách hàng mới tháng này"
          value={formatNumber(d.newUsersThisMonth)}
        />
        <Kpi
          icon={ShoppingBag}
          tone="warning"
          label="Tổng số đơn hàng"
          value={formatNumber(d.totalOrders)}
          sub={`${formatNumber(d.ordersThisMonth)} đơn trong tháng này`}
        />
        <Kpi
          icon={DollarSign}
          tone="violet"
          label="Tổng doanh thu"
          value={compactVnd(d.totalRevenue)}
          sub={`${formatPrice(d.revenueThisMonth)} trong tháng này`}
        />
      </div>

      <div className="chart-grid">
        <section className="card chart-card chart-card--wide">
          <h2 className="card__title">Sản phẩm bán chạy nhất (theo số lượng)</h2>
          <div className="chart chart--tall">
            <Bar
              data={{
                labels: d.bestSellers.map((b) => (b.name.length > 28 ? `${b.name.slice(0, 27)}…` : b.name)),
                datasets: [
                  {
                    label: 'Đã bán',
                    data: d.bestSellers.map((b) => b.qty),
                    backgroundColor: C.revenue,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: countAxis, y: { grid: { display: false } } },
              }}
            />
          </div>
        </section>

        <section className="card chart-card">
          <h2 className="card__title">Đơn hàng theo trạng thái</h2>
          <div className="chart">
            <Doughnut
              data={{
                labels: statusKeys.map((k) => ORDER_STATUS[k].label),
                datasets: [
                  {
                    data: statusKeys.map((k) => d.ordersByStatus[k]),
                    backgroundColor: statusKeys.map((k) => statusColors[k] || PALETTE[7]),
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
        </section>

        <section className="card chart-card chart-card--full">
          <h2 className="card__title">Doanh thu 12 tháng gần nhất</h2>
          <div className="chart">
            <Line
              data={{
                labels: d.revenueByMonth.map((m) => m.label),
                datasets: [
                  {
                    label: 'Doanh thu',
                    data: d.revenueByMonth.map((m) => m.revenue),
                    borderColor: C.revenue,
                    backgroundColor: 'rgba(36,87,245,.1)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: moneyTooltip },
                scales: { y: moneyAxis, x: { grid: { display: false } } },
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
