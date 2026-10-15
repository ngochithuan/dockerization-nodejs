const priceFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

export function formatPrice(value: number) {
  return priceFormat.format(value)
}

export function formatDate(value: string | null) {
  return value ? dateFormat.format(new Date(value)) : '—'
}

// Bỏ dấu tiếng Việt để tìm "ca phe" vẫn ra "Cà phê"
export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

// Màu ổn định theo danh mục, dùng cho ảnh placeholder
export function hueFor(value: string) {
  let hash = 0
  for (const ch of value) hash = (hash * 31 + ch.codePointAt(0)!) % 360
  return hash
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
}
