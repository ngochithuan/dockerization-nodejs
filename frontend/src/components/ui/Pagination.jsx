import { ChevronLeft, ChevronRight } from 'lucide-react';

// Builds [1, '…', 4, 5, 6, '…', 20]. Always returns at least [1] so page numbers are
// rendered even when there is a single page (spec requirement).
function pageItems(page, totalPages) {
  const total = Math.max(1, totalPages);
  const set = new Set([1, total, page - 1, page, page + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  const last = Math.max(1, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>
      {pageItems(page, last).map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="pagination__gap">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="pagination__btn"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => item !== page && onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= last}
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </button>
      {typeof total === 'number' && (
        <p className="pagination__meta">
          Hiển thị {from}–{to} trên tổng {total} · Trang {page}/{last}
        </p>
      )}
    </nav>
  );
}
