import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Boxes, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api.js';
import { C, PALETTE, compactVnd, countAxis, moneyAxis, moneyTooltip } from '../../lib/charts.js';
import { formatDate, formatNumber, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Kpi from '../../components/admin/Kpi.jsx';

const PERIODS = [
  { value: 'year', label: 'Theo năm' },
  { value: 'quarter', label: 'Theo quý' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'week', label: 'Theo tuần' },
  { value: 'custom', label: 'Tùy chọn' },
];
const UNIT_LABEL = { year: 'năm', quarter: 'quý', month: 'tháng', week: 'tuần', day: 'ngày' };

export default function AnalyticsPage() {
  useTitle('Thống kê nâng cao');
  const [params, setParams] = useSearchParams();
  const period = params.get('period') || 'year'; // annual by default
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const [draft, setDraft] = useState({ from, to });
  const [rangeError, setRangeError] = useState('');

  const query = period === 'custom' ? { period, from, to } : { period };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'analytics', query],
    queryFn: () => api.get('/admin/analytics', { params: query }),
    enabled: period !== 'custom' || Boolean(from && to),
    placeholderData: keepPreviousData,
  });

  const choose = (p) => {
    if (p === 'custom') {
      const today = new Date().toISOString().slice(0, 10);
      const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
      const next = { from: draft.from || monthAgo, to: draft.to || today };
      setDraft(next);
      setParams({ period: p, ...next });
    } else setParams({ period: p });
  };

  const applyRange = (e) => {
    e.preventDefault();
    if (!draft.from || !draft.to || draft.from > draft.to) {
      setRangeError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
      return;
    }
    setRangeError('');
    setParams({ period: 'custom', ...draft });
  };

  const b = data?.buckets || [];
  const labels = b.map((x) => x.label);

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Thống kê nâng cao</h1>
          <p className="muted">
            {data
              ? `Từ ${formatDate(data.from)} đến ${formatDate(data.to)} · chia theo ${UNIT_LABEL[data.unit]}`
              : 'Đang tải…'}
          </p>
        </div>
      </div>

      <div className="card card__body period-bar">
        <div className="segmented segmented--text" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-pressed={period === p.value}
              onClick={() => choose(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <form className="range-form" onSubmit={applyRange}>
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
              Xem
            </Button>
            {rangeError && <span className="field__error">{rangeError}</span>}
          </form>
        )}
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <PageLoader />
      ) : (
        <div className="stack-lg" style={{ opacity: isFetching ? 0.6 : 1 }}>
          <div className="kpis">
            <Kpi
              icon={ShoppingBag}
              tone="warning"
              label="Số đơn hàng"
              value={formatNumber(data.totals.orders)}
            />
            <Kpi
              icon={DollarSign}
              label="Doanh thu"
              value={compactVnd(data.totals.revenue)}
              sub={formatPrice(data.totals.revenue)}
            />
            <Kpi
              icon={TrendingUp}
              tone="success"
              label="Lợi nhuận"
              value={compactVnd(data.totals.profit)}
              sub={formatPrice(data.totals.profit)}
            />
            <Kpi
              icon={Boxes}
              tone="violet"
              label="Sản phẩm đã bán"
              value={formatNumber(data.totals.productsSold)}
            />
          </div>

          <div className="chart-grid">
            <section className="card chart-card chart-card--full">
              <h2 className="card__title">So sánh doanh thu và lợi nhuận</h2>
              <div className="chart chart--tall">
                <Bar
                  data={{
                    labels,
                    datasets: [
                      {
                        label: 'Doanh thu',
                        data: b.map((x) => x.revenue),
                        backgroundColor: C.revenue,
                        borderRadius: 4,
                      },
                      {
                        label: 'Lợi nhuận',
                        data: b.map((x) => x.profit),
                        backgroundColor: C.profit,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { tooltip: moneyTooltip },
                    scales: { y: moneyAxis, x: { grid: { display: false } } },
                  }}
                />
              </div>
            </section>

            <section className="card chart-card">
              <h2 className="card__title">Số đơn hàng</h2>
              <div className="chart">
                <Bar
                  data={{
                    labels,
                    datasets: [
                      {
                        label: 'Đơn hàng',
                        data: b.map((x) => x.orders),
                        backgroundColor: C.orders,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: countAxis, x: { grid: { display: false } } },
                  }}
                />
              </div>
            </section>

            <section className="card chart-card">
              <h2 className="card__title">Số sản phẩm bán ra</h2>
              <div className="chart">
                <Bar
                  data={{
                    labels,
                    datasets: [
                      {
                        label: 'Sản phẩm',
                        data: b.map((x) => x.productsSold),
                        backgroundColor: C.products,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: countAxis, x: { grid: { display: false } } },
                  }}
                />
              </div>
            </section>

            <section className="card chart-card">
              <h2 className="card__title">Tỷ trọng theo danh mục</h2>
              <div className="chart chart--tall">
                <Doughnut
                  data={{
                    labels: data.categoryTotals.map((c) => c.name),
                    datasets: [
                      {
                        data: data.categoryTotals.map((c) => c.qty),
                        backgroundColor: data.categoryTotals.map(
                          (c) => PALETTE[data.categories.indexOf(c.name) % PALETTE.length],
                        ),
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '58%',
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
            </section>
            <section className="card chart-card chart-card--full">
              <h2 className="card__title">Loại sản phẩm bán ra theo {UNIT_LABEL[data.unit]}</h2>
              <div className="chart chart--tall">
                <Bar
                  data={{
                    labels,
                    datasets: data.categories.map((name, i) => ({
                      label: name,
                      data: b.map((x) => x.byCategory[name] || 0),
                      backgroundColor: PALETTE[i % PALETTE.length],
                    })),
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: {
                      x: { stacked: true, grid: { display: false } },
                      y: { ...countAxis, stacked: true },
                    },
                  }}
                />
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Chi tiết theo {UNIT_LABEL[data.unit]}</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th className="num">Đơn hàng</th>
                    <th className="num">Doanh thu</th>
                    <th className="num">Lợi nhuận</th>
                    <th className="num">SP bán ra</th>
                  </tr>
                </thead>
                <tbody>
                  {[...b].reverse().map((x) => (
                    <tr key={x.key}>
                      <td>{x.label}</td>
                      <td className="num">{formatNumber(x.orders)}</td>
                      <td className="num">{formatPrice(x.revenue)}</td>
                      <td className={`num ${x.profit < 0 ? 'text-danger' : 'text-success'}`}>
                        {formatPrice(x.profit)}
                      </td>
                      <td className="num">{formatNumber(x.productsSold)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
