// Thin fetch wrapper: same-origin cookies, JSON in/out, and the backend's shared error
// format `{ error: { code, message, details } }` surfaced as an ApiError.
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Map zod-style details [{path, message}] to { field: message } for inline form errors. */
  fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.path, d.message]));
  }
}

const BASE = '/api/v1';

export async function apiFetch(path, { method = 'GET', body, params, signal } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
      else qs.set(k, v);
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code || 'HTTP_ERROR', e?.message || 'Đã có lỗi xảy ra', e?.details);
  }
  return data;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' }),
};
