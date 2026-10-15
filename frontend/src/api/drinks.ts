import type { Drink, DrinkInput } from '../types'

// Mặc định gọi cùng origin (/api) — Vite dev server / reverse proxy sẽ chuyển tiếp tới backend.
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Hãy kiểm tra backend.', 0)
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(body?.message ?? `Yêu cầu thất bại (HTTP ${res.status})`, res.status)
  }
  return body as T
}

export const drinkApi = {
  list: () => request<Drink[]>('/drinks'),

  get: (id: string) => request<Drink>(`/drinks/${id}`),

  create: (data: DrinkInput) =>
    request<Drink>('/drinks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: DrinkInput) =>
    request<Drink>(`/drinks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  remove: (id: string) =>
    request<{ message: string; drink: Drink }>(`/drinks/${id}`, { method: 'DELETE' }),
}
