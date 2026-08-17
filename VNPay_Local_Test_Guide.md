# HƯỚNG DẪN KIỂM THỬ TÍCH HỢP VNPAY TẠI LOCAL (LIVE NGROK & POSTMAN)

Tài liệu này quy định chuẩn kiến trúc mới trong việc xử lý thanh toán VNPay và hướng dẫn kiểm thử cho toàn bộ nhóm phát triển (`GreenSlot`).

---

## 1. KIẾN TRÚC THU THẬP KẾT QUẢ THANH TOÁN (KIẾN TRÚC MỚI)

Theo kiến trúc chuẩn bảo mật:
- **Frontend (`GreenSlot-FrontEnd`) TUYỆT ĐỐI KHÔNG gọi API IPN (`/api/payments/vnpay-ipn`) từ trình duyệt.** Khi VNPay chuyển hướng người dùng về `Return URL` (route `/payment-result`), Frontend chỉ chịu trách nhiệm đọc các tham số trên URL query string (`vnp_ResponseCode`, `vnp_TransactionStatus`) thông qua hook `useSearchParams` để cập nhật trạng thái giao diện ("Thành công" hoặc "Thất bại") phục vụ trải nghiệm người dùng.
- **Backend (`GreenSlot-BackEnd`) TỰ ĐỘNG xử lý cập nhật cơ sở dữ liệu** thông qua đường dẫn IPN Webhook trực tiếp từ máy chủ VNPay (server-to-server).

---

## 2. CẤU HÌNH LIVE TUNNEL VỚI NGROK

Hiện tại, môi trường kiểm thử tích hợp thực tế đã được thiết lập qua tunnel Ngrok:
- **Ngrok Forwarding URL:** `https://dramatic-acre-query.ngrok-free.dev` -> `http://localhost:8080`
- **VNPay IPN Webhook URL (tự động nhận từ VNPay):**
  ```text
  https://dramatic-acre-query.ngrok-free.dev/api/payments/vnpay-ipn
  ```

### Quy trình hoạt động thực tế:
1. Khi khách hàng nhấn thanh toán (`POST /api/bookings/book` hoặc `POST /api/bookings/extend`), Backend tạo `PaymentUrl` mang tham số `vnp_ReturnUrl` trỏ về Frontend (`/payment-result`) và thông báo cho VNPay biết đường dẫn IPN là URL Ngrok phía trên.
2. Khi giao dịch hoàn tất trên cổng VNPay, máy chủ VNPay tự động gọi `GET https://dramatic-acre-query.ngrok-free.dev/api/payments/vnpay-ipn` kèm chữ ký bảo mật (`vnp_SecureHash`).
3. Backend xác thực chữ ký, kiểm tra số tiền, chuyển trạng thái `SlotRental` sang `ACTIVE` và `GardenSlot` sang `RENTED` trong cơ sở dữ liệu hoàn toàn tự động.

---

## 3. GIẢ LẬP IPN BẰNG POSTMAN (DÀNH CHO DEV KHÔNG CHẠY NGROK)

Đối với các lập trình viên phát triển cục bộ không mở tunnel Ngrok hoặc muốn tự kiểm thử luồng cập nhật trạng thái đơn hàng khi không kết nối trực tiếp với VNPay, hãy sử dụng Postman để giả lập lời gọi IPN theo các bước sau:

### Bước 1: Tạo đơn đặt thuê vườn hoặc gia hạn
Gọi endpoint đặt lịch trên Backend để tạo đơn đặt thuê ở trạng thái `PENDING`:
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/bookings/book`
- **Header:** `Authorization: Bearer <your_jwt_token>`
- **Body (JSON):**
  ```json
  {
    "slotId": 1,
    "durationInMonths": 3,
    "startTime": "2026-07-15T08:00:00"
  }
  ```
- **Phản hồi:** Bạn sẽ nhận được `vnpTxnRef` (ví dụ: `BOOK_1_3_a1b2c3d4`) và `paymentUrl`.

### Bước 2: Giả lập Webhook IPN qua Postman
Gửi request trực tiếp đến Backend localhost để giả lập máy chủ VNPay xác nhận thanh toán thành công:

- **Method:** `GET`
- **URL:** `http://localhost:8080/api/payments/vnpay-ipn`
- **Query Parameters (Params):**

| Key | Value | Mô tả |
| :--- | :--- | :--- |
| `vnp_Amount` | `150000000` | Số tiền nhân 100 (Ví dụ: 1,500,000 VND -> `150000000`) |
| `vnp_BankCode` | `NCB` | Mã ngân hàng kiểm thử |
| `vnp_BankTranNo` | `VNP12345678` | Mã giao dịch ngân hàng giả lập |
| `vnp_CardType` | `ATM` | Loại thẻ |
| `vnp_OrderInfo` | `Thanh toan thue vuon` | Nội dung thanh toán |
| `vnp_PayDate` | `20260713222135` | Thời gian thanh toán format `yyyyMMddHHmmss` |
| `vnp_ResponseCode` | `00` | `00` là thành công (`24` là hủy, v.v.) |
| `vnp_TmnCode` | `1COY3S4A` | Mã TmnCode Sandbox của dự án |
| `vnp_TransactionNo` | `14253647` | Mã giao dịch trên hệ thống VNPay |
| `vnp_TransactionStatus` | `00` | `00` là thành công |
| `vnp_TxnRef` | `BOOK_1_3_a1b2c3d4` | Điền chính xác `vnpTxnRef` nhận được từ Bước 1 |
| `vnp_SecureHash` | `sandbox_bypass_hash_or_valid_hmac` | Chữ ký SHA512 (Backend Sandbox `1COY3S4A` hỗ trợ bypass/verifying) |

- **Phản hồi kỳ vọng từ Backend:**
  ```json
  {
    "RspCode": "00",
    "Message": "Confirm Success"
  }
  ```

### Bước 3: Kiểm tra cơ sở dữ liệu
Sau khi nhận phản hồi `{"RspCode":"00"}`, kiểm tra lại API danh sách thuê hoặc database:
- `SlotRental`: Chuyển từ `PENDING` sang `ACTIVE`.
- `GardenSlot`: Chuyển từ `PENDING_PAYMENT` sang `RENTED`.
- `PaymentTransaction`: Chuyển từ `PENDING` sang `SUCCESS`.
