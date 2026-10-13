Làm trong thư mực backend/

Techstack:
Database: MongoDB
Backend: Express.js

Tạo database
Drink
- name
- category
- description
- price
- size
- image_url
- status
- create_at
- update_at

Sau đó làm giúp tôi file seed.js:
- Xóa db nếu có
- tạo db
- thêm dữ liệu mockup (Mô tả dữ liệu sẽ được nêu ở phần tiếp theo)

Drink
- name: tiếng Việt
- category: tiếng Việt
- description: tiếng Việt
- price: giá theo Việt Nam (không cần ghi VND, ví dụ: 15.000VND thì chỉ cần ghi 15000)
- size: một trong ba: S, M, L
- image_url: mặc định luôn là "https://dummyimage.com/100x100/8f8f8f/000000.jpg" khi tạo
- status: một trong: Còn, Không khả dụng
- created_at: timestamp tạo dữ liệu (ngẫu nhiên trước ngày 10/10/2026)
- updated_at: timestamp cập nhật dữ liệu (ngẫu nhiên trước ngày 10/10/2026 nhưng phải sau create_at)

CRUD về nước uống (Express.js)

POST    /drinks (Thêm 1 nước)
nhận name, category, description, price, size, image_url, status
sẽ tự động thêm created_at dựa trên timestamp khi thêm nước, updated_at sẽ trống

GET     /drinks (Lấy danh sách tất cả nước)
GET     /drinks/:id (Lấy thông tin chi tiết của nước)

PUT     /drinks/:id (Cập nhật thông tin của nước)
nhận name, category, description, price, size, image_url, status
sẽ tự cập nhật updated_at dựa trên timestamp khi cập nhật thông tin nước

DELETE  /drinks/:id (Xóa nước khỏi db)
xóa hẳn khỏi DB

nên định tuyến api bằng route

ví dụ một đường dẫn sẽ trông như:
GET http://localhost:8080/api/drinks

