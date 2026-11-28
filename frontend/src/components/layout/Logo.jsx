import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Circuit — Trang chủ">
      <span className="logo__mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 32 32">
          <path
            d="M21 11.5a7 7 0 1 0 0 9"
            fill="none"
            stroke="#fff"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <circle cx="22.5" cy="16" r="2.2" fill="#ff5a4e" />
        </svg>
      </span>
      <span>
        Circuit<span className="logo__dot">.</span>
        <span className="logo__sub">Máy tính & Linh kiện</span>
      </span>
    </Link>
  );
}
