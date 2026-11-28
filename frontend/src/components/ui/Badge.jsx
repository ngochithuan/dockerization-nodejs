export default function Badge({ tone = 'neutral', plain, children }) {
  const cls = ['badge', tone !== 'neutral' && `badge--${tone}`, plain && 'badge--plain']
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
}

// Order status -> label + colour. Shared by customer and admin order views.
export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  shipping: { label: 'Đang giao', tone: 'violet' },
  delivered: { label: 'Đã giao', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
};

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
