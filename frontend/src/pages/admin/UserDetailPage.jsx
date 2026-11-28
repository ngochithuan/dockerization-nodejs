import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Ban, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDate, formatDateTime, formatNumber, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import Badge, { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { formatAddress } from '../../components/order/OrderView.jsx';

export default function UserDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.get(`/admin/users/${id}`),
  });
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useTitle(data?.user.fullName || 'Người dùng');

  useEffect(() => {
    if (data) setForm({ fullName: data.user.fullName, email: data.user.email });
  }, [data]);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const { user, stats, recentOrders } = data;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
    qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, { fullName: form.fullName.trim(), email: form.email.trim() });
      setErrors({});
      toast.success('Đã cập nhật thông tin');
      refresh();
    } catch (err) {
      setErrors(err.code === 'EMAIL_TAKEN' ? { email: err.message } : err.fieldErrors());
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBan = async () => {
    const banned = !user.isBanned;
    if (
      !window.confirm(
        banned ? `Khóa tài khoản ${user.email}? Người dùng sẽ bị đăng xuất ngay.` : `Mở khóa ${user.email}?`,
      )
    )
      return;
    try {
      await api.post(`/admin/users/${id}/ban`, { banned });
      toast.success(banned ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="stack-lg">
      <Link to="/admin/users" className="link-arrow">
        <ArrowLeft size={16} /> Danh sách người dùng
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title row">
            {user.fullName}{' '}
            {user.isBanned ? <Badge tone="danger">Đã khóa</Badge> : <Badge tone="success">Hoạt động</Badge>}
          </h1>
          <p className="muted">
            {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'} · Tạo ngày {formatDate(user.createdAt)}
          </p>
        </div>
        {user.role !== 'admin' && (
          <Button
            variant={user.isBanned ? 'primary' : 'danger'}
            icon={user.isBanned ? <ShieldCheck size={16} /> : <Ban size={16} />}
            onClick={toggleBan}
          >
            {user.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          </Button>
        )}
      </div>

      <div className="kpis kpis--3">
        <div className="mini-stat">
          <span>Số đơn hàng</span>
          <strong>{formatNumber(stats.orders)}</strong>
        </div>
        <div className="mini-stat">
          <span>Tổng chi tiêu</span>
          <strong>{formatPrice(stats.spent)}</strong>
        </div>
        <div className="mini-stat">
          <span>Điểm tích lũy</span>
          <strong>{formatNumber(user.loyaltyPoints)}</strong>
        </div>
      </div>

      <div className="form-cols">
        <form className="card card__body stack" onSubmit={save} noValidate>
          <h2 className="card__title">Thông tin tài khoản</h2>
          <Field
            label="Họ và tên"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={errors.fullName}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <p className="muted small">
            Đăng nhập:{' '}
            {[user.hasPassword && 'mật khẩu', user.googleLinked && 'Google'].filter(Boolean).join(', ') ||
              'chưa đặt mật khẩu'}
          </p>
          <div>
            <Button type="submit" variant="primary" loading={saving}>
              Lưu thông tin
            </Button>
          </div>
        </form>

        <section className="card card__body stack">
          <h2 className="card__title">Sổ địa chỉ ({user.addresses.length})</h2>
          {user.addresses.length === 0 && <p className="muted">Chưa có địa chỉ</p>}
          {user.addresses.map((a) => (
            <div key={a._id} className="addr-mini">
              <strong>
                {a.recipientName} {a.phone && `· ${a.phone}`}
              </strong>{' '}
              {a.isDefault && (
                <Badge tone="brand" plain>
                  Mặc định
                </Badge>
              )}
              <p className="muted">{formatAddress(a)}</p>
            </div>
          ))}
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Đơn hàng gần đây</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th className="num">Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <Link to={`/admin/orders/${o._id}`} className="strong-link tabular">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="tabular">{formatDateTime(o.createdAt)}</td>
                  <td className="num">{formatPrice(o.total)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
