import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatNumber, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';

export default function ProductsPage() {
  useTitle('Quản lý sản phẩm');
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const [term, setTerm] = useState(q);
  useEffect(() => {
    setTerm(q);
  }, [q]);

  const { data: cats } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/admin/categories'),
  });
  const query = { page, q, category: category || undefined, limit: 12 };
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'products', query],
    queryFn: () => api.get('/admin/products', { params: query }),
    placeholderData: keepPreviousData,
  });

  const setFilter = (changes) => {
    const next = { q, category, ...changes };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  const remove = async (p) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"? Đơn hàng cũ vẫn giữ thông tin sản phẩm.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success('Đã xóa sản phẩm');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Sản phẩm & tồn kho</h1>
          <p className="muted">{data ? `${data.total} sản phẩm` : ''}</p>
        </div>
        <Button to="/admin/products/new" variant="primary" icon={<Plus size={16} />}>
          Thêm sản phẩm
        </Button>
      </div>

      <div className="card card__body filter-bar">
        <form
          className="search-inline"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: term.trim(), page: '' });
          }}
        >
          <Search size={16} />
          <input
            className="input"
            placeholder="Tìm theo tên, thương hiệu, SKU…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </form>
        <select
          className="select"
          value={category}
          onChange={(e) => setFilter({ category: e.target.value, page: '' })}
          aria-label="Lọc theo danh mục"
        >
          <option value="">Tất cả danh mục</option>
          {cats?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Package} title="Không có sản phẩm" />
      ) : (
        <section className="card" style={{ opacity: isFetching ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th className="num">Giá</th>
                  <th className="num">Phiên bản</th>
                  <th className="num">Tồn kho</th>
                  <th className="num">Đã bán</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-product">
                        {p.image && <img src={p.image} alt="" width="44" height="44" loading="lazy" />}
                        <div>
                          <Link to={`/admin/products/${p.id}`} className="strong-link">
                            {p.name}
                          </Link>
                          <span className="muted">{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category?.name}</td>
                    <td className="num">
                      {formatPrice(p.minPrice)}
                      {p.maxPrice !== p.minPrice && (
                        <span className="muted"> – {formatPrice(p.maxPrice)}</span>
                      )}
                    </td>
                    <td className="num">{p.variantCount}</td>
                    <td className="num">
                      <span
                        className={p.lowStock ? 'text-warning row' : ''}
                        style={{ justifyContent: 'flex-end', gap: 4 }}
                      >
                        {p.lowStock && <AlertTriangle size={14} />}
                        {formatNumber(p.totalStock)}
                      </span>
                    </td>
                    <td className="num">{formatNumber(p.soldCount)}</td>
                    <td>{p.isActive ? <Badge tone="success">Đang bán</Badge> : <Badge>Ẩn</Badge>}</td>
                    <td>
                      <div className="row-actions">
                        <Button
                          to={`/admin/products/${p.id}`}
                          size="sm"
                          icon={<Pencil size={14} />}
                          aria-label="Sửa"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={14} />}
                          aria-label="Xóa"
                          onClick={() => remove(p)}
                        />
                      </div>
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
          onChange={(p) => setFilter({ page: String(p) })}
        />
      )}
    </div>
  );
}
