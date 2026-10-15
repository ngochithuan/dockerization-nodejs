import { useCallback, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

let nextId = 1

export function useToasts(duration = 3500) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++
      setToasts((list) => [...list, { id, type, message }])
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss, duration],
  )

  return { toasts, notify, dismiss }
}
