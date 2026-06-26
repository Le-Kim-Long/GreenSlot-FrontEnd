# GreenSlot FrontEnd

GreenSlot là nền tảng quản lý và thuê vườn canh tác đô thị thông minh. Hệ thống cho phép người dùng thuê các ô vườn, giám sát các chỉ số môi trường qua cảm biến IoT (nhiệt độ, độ ẩm, ánh sáng, độ ẩm đất), và đặt các dịch vụ chăm sóc cây trồng.

## Công nghệ sử dụng

- **Khung giao diện:** React (v18)
- **Công cụ build:** Vite
- **Ngôn ngữ:** TypeScript
- **CSS Framework:** Tailwind CSS
- **Routing:** React Router v6
- **Icons:** Lucide React

## Cấu trúc thư mục chính

- `src/api`: Cấu hình Axios và các hàm gọi API tương tác với Backend.
- `src/components`: Các component dùng chung (Navbar, Footer, Layout,...).
- `src/context`: React Context quản lý trạng thái toàn cục (ví dụ: AuthContext).
- `src/pages`: Giao diện các trang của ứng dụng (Admin, Customer, Staff, Auth, v.v.).
- `src/types`: Định nghĩa các kiểu dữ liệu TypeScript.
- `src/utils`: Các hàm tiện ích (utilities) hỗ trợ xử lý logic.

## Hướng dẫn cài đặt và chạy thử

### Yêu cầu hệ thống
- Node.js (phiên bản 18+ khuyến nghị)
- npm hoặc yarn

### Các bước thực hiện

1. **Cài đặt các gói phụ thuộc (Dependencies)**
   Mở terminal tại thư mục gốc của dự án và chạy:
   ```bash
   npm install
   ```

2. **Cấu hình môi trường**
   Tạo file `.env` ở thư mục gốc (hoặc copy từ `.env.example` nếu có) và cấu hình các biến môi trường cần thiết (ví dụ: `VITE_API_BASE_URL`).

3. **Chạy server phát triển (Development mode)**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ mặc định: `http://localhost:5173/`

4. **Build để triển khai (Production mode)**
   ```bash
   npm run build
   ```
   Thư mục `dist` sẽ được tạo ra, chứa toàn bộ các file tĩnh đã được tối ưu hóa.

## Phân quyền hệ thống (Roles)

Hệ thống được chia thành nhiều quyền hạn khác nhau với các Dashboard riêng biệt:
- **Khách hàng (Customer):** Thuê vườn, xem biểu đồ IoT, quản lý đơn thanh toán.
- **Nhân viên (Staff) & Quản lý cơ sở (Location Manager):** Quản lý chi nhánh, khu vực, dịch vụ và hợp đồng.
- **Nhân viên vườn (Garden Staff):** Cập nhật trạng thái chăm sóc vườn.
- **Quản trị viên (Admin):** Quản lý toàn bộ người dùng, quyền truy cập và dữ liệu báo cáo tổng quan.