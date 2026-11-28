import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDate, formatNumber } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';

export default function UsersPage() {
  useTitle('Quản lý người dùng');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') || '';
  const [term, setTerm] = useState(q);
  useEffect(() => {
    setTerm(q);
  }, [q]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'users', page, q],
    queryFn: () => api.get('/admin/users', { params: { page, q } }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">Người dùng</h1>
          <p className="muted">{data ? `${data.total} tài khoản` : ''}</p>
        </div>
      </div>
      <div className="card card__body filter-bar">
        <form
          className="search-inline"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(term.trim() ? { q: term.trim() } : {});
          }}
        >
          <Search size={16} />
          <input
            className="input"
            placeholder="Tìm theo tên hoặc email…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </form>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title="Không tìm thấy người dùng" />
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th className="num">Điểm</th>
                  <th>Đăng nhập</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link to={`/admin/users/${u.id}`} className="strong-link">
                        {u.fullName}
                      </Link>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <Badge tone="brand">Quản trị</Badge>
                      ) : (
                        <Badge plain>Khách hàng</Badge>
                      )}
                    </td>
                    <td className="num">{formatNumber(u.loyaltyPoints)}</td>
                    <td className="muted">
                      {[u.hasPassword && 'Mật khẩu', u.googleLinked && 'Google']
                        .filter(Boolean)
                        .join(' · ') || 'Chưa đặt mật khẩu'}
                    </td>
                    <td className="tabular">{formatDate(u.createdAt)}</td>
                    <td>
                      {u.isBanned ? (
                        <Badge tone="danger">Đã khóa</Badge>
                      ) : (
                        <Badge tone="success">Hoạt động</Badge>
                      )}
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
          onChange={(p) => setParams({ ...(q ? { q } : {}), page: p })}
        />
      )}
    </div>
  );
}
