# Frontend – Drink Menu

Giao diện React + TypeScript (Vite) quản lý đồ uống, dùng REST API của `backend/`.

| Thao tác | Endpoint |
| --- | --- |
| Danh sách | `GET /api/drinks` |
| Chi tiết | `GET /api/drinks/:id` |
| Thêm | `POST /api/drinks` |
| Sửa | `PUT /api/drinks/:id` |
| Xóa | `DELETE /api/drinks/:id` |

## Chạy local

```bash
npm install
npm run dev      # http://localhost:5173
```

Frontend gọi `/api` cùng origin; Vite proxy chuyển tiếp tới backend (mặc định `http://localhost:8080`).

## Biến môi trường

| Biến | Dùng khi | Mặc định |
| --- | --- | --- |
| `API_PROXY_TARGET` | `npm run dev` / `npm run preview` – địa chỉ backend để proxy `/api` | `http://localhost:8080` |
| `VITE_API_URL` | Build time – base URL trình duyệt gọi API (VD: `http://localhost:8080/api`) | `/api` |

## Build

```bash
npm run build    # output: dist/ (static files)
```
