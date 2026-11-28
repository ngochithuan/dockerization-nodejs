import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  TicketPercent,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/layout/Logo.jsx';
import { PageLoader } from '../../components/ui/States.jsx';

// The admin area contains exactly the features required by the spec — nothing else.
const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Thống kê nâng cao' },
  { to: '/admin/products', icon: Package, label: 'Sản phẩm & tồn kho' },
  { to: '/admin/categories', icon: FolderTree, label: 'Danh mục' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/users', icon: Users, label: 'Người dùng' },
  { to: '/admin/discounts', icon: TicketPercent, label: 'Mã giảm giá' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={`admin ${open ? 'admin--open' : ''}`}>
      <aside className="admin__side">
        <div className="admin__brand">
          <Logo />
          <span className="badge badge--brand badge--plain">Admin</span>
        </div>
        <nav className="admin__nav">
          {NAV.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__side-foot">
          <Link to="/">
            <Store size={18} /> Xem cửa hàng
          </Link>
          <button type="button" onClick={logout}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>
      {open && <div className="admin__scrim" onClick={() => setOpen(false)} />}
      <div className="admin__body">
        <header className="admin__top">
          <button
            type="button"
            className="btn btn--ghost btn--icon admin__menu"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>
          <span className="muted hide-sm">Trang quản trị Circuit</span>
          <span className="admin__who">
            <span className="avatar">{user.fullName[0]}</span>
            <span className="hide-sm">{user.email}</span>
          </span>
        </header>
        <main className="admin__main">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
