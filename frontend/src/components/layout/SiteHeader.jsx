import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  BadgePercent,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
} from 'lucide-react';
import { CATEGORIES } from '../../lib/categories.js';
import { formatNumber } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Logo from './Logo.jsx';
import SearchBox from './SearchBox.jsx';
import MobileNav from './MobileNav.jsx';

function CategoryNav() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const current = pathname === '/products' ? params.get('category') : null;
  return (
    <nav className="catnav" aria-label="Danh mục sản phẩm">
      <div className="container">
        <ul className="catnav__list">
          {CATEGORIES.map(({ slug, name, icon: Icon }) => (
            <li key={slug}>
              <NavLink
                to={`/products?category=${slug}`}
                className={() => `catnav__link ${current === slug ? 'active' : ''}`}
              >
                <Icon size={16} />
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="header-action">
        <User size={20} />
        <span className="header-action__label">
          <small>Xin chào</small>
          Đăng nhập
        </span>
      </Link>
    );
  }

  const firstName = user.fullName.split(' ').slice(-1)[0];
  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="header-action"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{firstName[0]}</span>
        <span className="header-action__label">
          <small>{isAdmin ? 'Quản trị viên' : `${formatNumber(user.loyaltyPoints)} điểm`}</small>
          {firstName}
        </span>
        <ChevronDown size={14} className="hide-sm" />
      </button>
      {open && (
        <div className="dropdown__menu" role="menu">
          <div className="dropdown__head">
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
          </div>
          {isAdmin && (
            <Link to="/admin" role="menuitem">
              <LayoutDashboard size={16} /> Trang quản trị
            </Link>
          )}
          <Link to="/account" role="menuitem">
            <User size={16} /> Tài khoản của tôi
          </Link>
          <Link to="/account/orders" role="menuitem">
            <Package size={16} /> Đơn hàng của tôi
          </Link>
          <Link to="/account/addresses" role="menuitem">
            <MapPin size={16} /> Sổ địa chỉ
          </Link>
          <Link to="/account/password" role="menuitem">
            <KeyRound size={16} /> {user.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </Link>
          <button type="button" role="menuitem" onClick={logout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__perks">
            <span>
              <Truck size={14} /> Miễn phí giao hàng cho đơn từ 5.000.000đ
            </span>
            <span>
              <ShieldCheck size={14} /> Hàng chính hãng, bảo hành đầy đủ
            </span>
            <span>
              <BadgePercent size={14} /> Tích điểm 10% mỗi đơn hàng
            </span>
          </div>
          <span>Mua hàng không cần đăng nhập</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container mainbar">
          <button
            type="button"
            className="header-action menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <Logo />
          <SearchBox />
          <div className="header-actions">
            <AccountMenu />
            <Link to="/cart" className="header-action" aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}>
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="cart-badge" key={itemCount}>
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
              <span className="header-action__label">
                <small>{itemCount} sản phẩm</small>
                Giỏ hàng
              </span>
            </Link>
          </div>
        </div>
        <div className="container mobile-search">
          <SearchBox />
        </div>
        <CategoryNav />
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
