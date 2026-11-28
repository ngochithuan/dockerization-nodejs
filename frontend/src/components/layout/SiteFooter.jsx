import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories.js';
import Logo from './Logo.jsx';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__about">
          <Logo />
          <p>
            Circuit chuyên máy tính và linh kiện: laptop, PC, màn hình, CPU, card đồ họa, RAM, ổ cứng,
            mainboard, nguồn và vỏ case. Hàng chính hãng, giá minh bạch.
          </p>
        </div>
        <div>
          <h3>Danh mục</h3>
          <ul>
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Linh kiện</h3>
          <ul>
            {CATEGORIES.slice(5).map((c) => (
              <li key={c.slug}>
                <Link to={`/products?category=${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <ul className="site-footer__contact">
            <li>
              <MapPin size={16} /> Số 1 Đường Linh Kiện, Quận 7, TP. Hồ Chí Minh (địa chỉ minh họa)
            </li>
            <li>
              <Mail size={16} /> hotro@circuit.local
            </li>
            <li>
              <Clock size={16} /> 8:00 – 21:00, tất cả các ngày
            </li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} Circuit. Đồ án cuối kỳ môn Lập trình Web với Node.js.</span>
        <span>VAT 10% được cộng vào đơn khi thanh toán.</span>
      </div>
    </footer>
  );
}
