import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/** items: [{ label, to? }] — the last item is the current page. */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumbs">
        <li>
          <Link to="/">
            <Home size={14} /> Trang chủ
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label}>
            <ChevronRight size={14} />
            {item.to && i < items.length - 1 ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
