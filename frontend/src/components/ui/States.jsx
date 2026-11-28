import { AlertTriangle, PackageOpen } from 'lucide-react';
import Button from './Button.jsx';

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Đang tải">
      <span className="spinner" />
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, text, action }) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon size={26} />
      </div>
      <h3 className="state__title">{title}</h3>
      {text && <p className="state__text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon">
        <AlertTriangle size={26} />
      </div>
      <h3 className="state__title">Không tải được dữ liệu</h3>
      <p className="state__text">{error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'}</p>
      {onRetry && (
        <Button variant="dark" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
