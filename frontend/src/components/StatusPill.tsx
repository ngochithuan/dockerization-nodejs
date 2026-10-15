import type { Status } from '../types'

// Đèn LED trạng thái: xanh = còn hàng, đỏ = không khả dụng
export default function StatusPill({ status }: { status: Status }) {
  const available = status === 'Còn'
  return (
    <span className={`led ${available ? 'led--on' : 'led--off'}`}>
      <span className={`lamp ${available ? 'lamp--green' : 'lamp--red'}`} aria-hidden="true" />
      {available ? 'Còn hàng' : status}
    </span>
  )
}
