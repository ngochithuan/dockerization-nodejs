import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, side = 'left', children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className={`drawer drawer--${side}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <h2 className="drawer__title">{title}</h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </aside>
    </>,
    document.body,
  );
}
