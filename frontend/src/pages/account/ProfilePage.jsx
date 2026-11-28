import { useState } from 'react';
import toast from 'react-hot-toast';
import { BadgePercent, CalendarDays } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDate, formatNumber, formatPrice } from '../../lib/format.js';
import { useTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';

export default function ProfilePage() {
  useTitle('Hồ sơ của tôi');
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user.fullName);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError('Họ tên tối thiểu 2 ký tự');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await api.patch('/account', { fullName: fullName.trim() });
      setUser(res.user);
      toast.success('Đã cập nhật hồ sơ');
    } catch (err) {
      setError(err.fieldErrors().fullName || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <h1 className="page-title">Hồ sơ của tôi</h1>
      <div className="points-card">
        <BadgePercent size={28} />
        <div>
          <span>Điểm tích lũy hiện có</span>
          <strong>{formatNumber(user.loyaltyPoints)} điểm</strong>
          <small>Tương đương {formatPrice(user.loyaltyPoints * 1000)} — dùng ngay ở bước thanh toán</small>
        </div>
      </div>
      <form className="card card__body stack" onSubmit={save} noValidate>
        <h2 className="card__title">Thông tin cá nhân</h2>
        <div className="form-grid">
          <Field
            label="Họ và tên"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={error}
          />
          <Field label="Email" value={user.email} readOnly hint="Email đăng nhập không thể thay đổi" />
        </div>
        <p className="muted row">
          <CalendarDays size={15} /> Thành viên từ {formatDate(user.createdAt)}
          {user.googleLinked && <span className="badge badge--info badge--plain">Đã liên kết Google</span>}
        </p>
        <div>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={fullName.trim() === user.fullName}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
