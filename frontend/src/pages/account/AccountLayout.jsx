import { NavLink, Outlet } from 'react-router-dom';
import { KeyRound, MapPin, Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatNumber } from '../../lib/format.js';

export default function AccountLayout() {
  const { user } = useAuth();
  return (
    <div className="container account">
      <aside className="account__nav card">
        <div className="account__user">
          <span className="avatar avatar--lg">{user.fullName.split(' ').slice(-1)[0][0]}</span>
          <div>
            <strong>{user.fullName}</strong>
            <span className="muted">{formatNumber(user.loyaltyPoints)} điểm tích lũy</span>
          </div>
        </div>
        <nav className="account__links">
          <NavLink to="/account" end>
            <User size={18} /> Hồ sơ
          </NavLink>
          <NavLink to="/account/orders">
            <Package size={18} /> Đơn hàng
          </NavLink>
          <NavLink to="/account/addresses">
            <MapPin size={18} /> Sổ địa chỉ
          </NavLink>
          <NavLink to="/account/password">
            <KeyRound size={18} /> {user.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </NavLink>
        </nav>
      </aside>
      <section className="account__main">
        <Outlet />
      </section>
    </div>
  );
}
