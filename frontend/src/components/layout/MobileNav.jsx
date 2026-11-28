import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, LayoutGrid, LogOut, Package, ShoppingCart, User } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Drawer from '../ui/Drawer.jsx';

export default function MobileNav({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <Drawer open={open} onClose={onClose} title="Menu">
      <nav className="drawer-nav" onClick={(e) => e.target.closest('a, button') && onClose()}>
        <p className="drawer-nav__title">Điều hướng</p>
        <NavLink to="/" end>
          <Home size={18} /> Trang chủ
        </NavLink>
        <NavLink to="/products" end>
          <LayoutGrid size={18} /> Tất cả sản phẩm
        </NavLink>
        <NavLink to="/cart">
          <ShoppingCart size={18} /> Giỏ hàng
        </NavLink>
        {user ? (
          <>
            <NavLink to="/account" end>
              <User size={18} /> Tài khoản ({user.fullName})
            </NavLink>
            <NavLink to="/account/orders">
              <Package size={18} /> Đơn hàng của tôi
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin">
                <LayoutDashboard size={18} /> Trang quản trị
              </NavLink>
            )}
            <button type="button" className="drawer-nav__btn" onClick={logout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </>
        ) : (
          <NavLink to="/login">
            <User size={18} /> Đăng nhập / Đăng ký
          </NavLink>
        )}

        <p className="drawer-nav__title">Danh mục</p>
        {CATEGORIES.map(({ slug, name, icon: Icon }) => (
          <NavLink key={slug} to={`/products?category=${slug}`}>
            <Icon size={18} /> {name}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  );
}
