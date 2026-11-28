import { useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { BadgePercent, Menu, ShieldCheck, ShoppingCart, Truck, User } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories.js';
import Logo from './Logo.jsx';
import SearchBox from './SearchBox.jsx';
import MobileNav from './MobileNav.jsx';

function CategoryNav() {
  const [params] = useSearchParams();
  const current = params.get('category');
  return (
    <nav className="catnav" aria-label="Danh mục sản phẩm">
      <div className="container">
        <ul className="catnav__list">
          {CATEGORIES.map(({ slug, name, icon: Icon }) => (
            <li key={slug}>
              <NavLink
                to={`/products?category=${slug}`}
                className={({ isActive }) => `catnav__link ${isActive && current === slug ? 'active' : ''}`}
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

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = 0;

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
            <Link to="/login" className="header-action">
              <User size={20} />
              <span className="header-action__label">
                <small>Xin chào</small>
                Đăng nhập
              </span>
            </Link>
            <Link to="/cart" className="header-action" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
              <span className="header-action__label">
                <small>{cartCount} sản phẩm</small>
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
