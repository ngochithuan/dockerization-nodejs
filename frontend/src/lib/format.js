const priceFormatter = new Intl.NumberFormat('vi-VN');

/** 75299000 -> "75.299.000đ" */
export function formatPrice(value) {
  return `${priceFormatter.format(Math.round(Number(value) || 0))}đ`;
}

export function formatNumber(value) {
  return priceFormatter.format(Number(value) || 0);
}

const pad = (n) => String(n).padStart(2, '0');

/** ISO string / Date -> "dd/MM/yyyy HH:mm" (local time) */
export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO string / Date -> "dd/MM/yyyy" */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
