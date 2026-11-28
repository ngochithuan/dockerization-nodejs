import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBox({ autoFocus }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  // Keep the box in sync when the URL query changes (back/forward, clearing filters).
  useEffect(() => setQ(params.get('q') || ''), [params]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label htmlFor="site-search" className="sr-only">
        Tìm kiếm sản phẩm
      </label>
      <input
        id="site-search"
        className="search__input"
        type="search"
        placeholder="Tìm laptop, VGA, SSD, màn hình…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        maxLength={100}
      />
      <button type="submit" className="search__btn" aria-label="Tìm kiếm">
        <Search size={18} />
      </button>
    </form>
  );
}
