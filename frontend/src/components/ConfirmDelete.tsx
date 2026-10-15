import { useState } from 'react'
import type { Drink } from '../types'

interface ConfirmDeleteProps {
  drink: Drink
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmDelete({ drink, onConfirm, onCancel }: ConfirmDeleteProps) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p className="confirm-text">
        Bạn có chắc muốn xóa <strong>{drink.name}</strong> khỏi danh sách? Thao tác này không thể
        hoàn tác.
      </p>
      <div className="modal__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Hủy
        </button>
        <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Đang xóa…' : 'Xóa'}
        </button>
      </div>
    </>
  )
}
