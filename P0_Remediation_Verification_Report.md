# BÁO CÁO THẨM ĐỊNH & KHẮC PHỤC LỖ HỔNG P0 CRITICAL (FULL-STACK REMEDIATION & VERIFICATION REPORT)

**Thời gian kiểm định:** 14/07/2026  
**Đơn vị kiểm định:** Principal Full-Stack Architecture & Security Audit Team  
**Phạm vi:** Kiểm tra chéo toàn bộ hệ thống (`GreenSlot-FrontEnd` & `GreenSlot-BackEnd`) theo báo cáo `FE_BE_Gap_Analysis.md`.

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM ĐỊNH (EXECUTIVE SUMMARY)

| Mã lỗi | Hạng mục / Lỗ hổng | Tệp bị ảnh hưởng | Trạng thái hiện tại | Đánh giá kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **P0-FE-01** | **Client-Side IPN Triggering Anti-Pattern** (Lỗ hổng giả mạo thanh toán từ Client) | `src/api/bookingApi.ts`<br>`src/pages/payment/PaymentResultPage.tsx` | **VERIFIED CLEAN**<br>*(Đã loại bỏ hoàn toàn)* | Frontend không còn gọi bất kỳ API nào tới endpoint `/payments/vnpay-ipn`. Trang kết quả chỉ đọc tham số URL (`vnp_ResponseCode`). |
| **P0-BE-01** | **IoT Telemetry Authorization Block (403 Forbidden)** (Khách hàng bị chặn xem dữ liệu cảm biến) | `swp490.greeenslot.controller.IoTSensorController.java` | **VERIFIED CLEAN**<br>*(Đã bổ sung phân quyền & Biên dịch)* | Endpoint `GET /sensors/latest` và `GET /sensors/history` đã được cấp quyền hợp lệ cho `ROLE_CUSTOMER`. |
| **P1-REG-01** | **Booking Price Calculation Bug** (Lỗi cộng dồn tiền gia hạn/thanh toán thất bại) | `src/utils/bookingAdapter.ts` | **VERIFIED CLEAN**<br>*(Đã lọc trạng thái giao dịch)* | Logic tính toán `totalPrice` lọc nghiêm ngặt các giao dịch có trạng thái `SUCCESS` hoặc `PAID`. |

---

## 2. CHI TIẾT KẾT QUẢ THẨM ĐỊNH TỪNG HẠNG MỤC P0

### 2.1. Kiểm tra Lỗ hổng P0 Frontend: IPN Anti-Pattern & IDOR Vulnerability (`Section 2.1`)

#### a. Vấn đề kiến trúc ban đầu
- Trình duyệt phía Client (`Frontend`) tự ý gọi API xác nhận giao dịch thanh toán (`/payments/vnpay-ipn`) ngay tại bước render kết quả thanh toán.
- **Rủi ro:** Kẻ tấn công có thể giả mạo request HTTP hoặc chỉnh sửa tham số URL trên trình duyệt nhằm kích hoạt giả lập thanh toán thành công mà không hề chuyển tiền qua cổng VNPay (IDOR / Payment Spoofing).

#### b. Kết quả xác minh tại `GreenSlot-FrontEnd/src/api/bookingApi.ts`
- Hàm `notifyVnPayResult` đã được **xóa bỏ hoàn toàn**.
- Không tồn tại bất kỳ định nghĩa API client nào gửi request tới `/payments/vnpay-ipn`.
- Mã nguồn hiện tại chỉ tập trung vào các chức năng chuẩn:

```typescript
// Trích xuất cấu trúc hiện tại của bookingApi.ts (Verified Clean)
export const bookingApi = {
  getAvailableSlots: (locationId?: number): Promise<AvailableSlot[]> => ...
  bookSlot: (data: BookingRequest): Promise<BookingResponse> => ...
  getHistory: (): Promise<BookingHistory[]> => ...
  extendBooking: (data: ExtensionRequest): Promise<BookingResponse> => ...
  getPaymentUrl: (rentalId: number): Promise<BookingResponse> => ...
  cancelBooking: (rentalId: number): Promise<void> => ...
};
```

#### c. Kết quả xác minh tại `GreenSlot-FrontEnd/src/pages/payment/PaymentResultPage.tsx`
- Component **hoàn toàn không có hook `useEffect`** hoặc bất kỳ lời gọi API bất đồng bộ nào tới Backend.
- Trách nhiệm của UI được thu gọn đúng chuẩn SPA (Single Page Application): Phân tích chuỗi truy vấn (`query string`) từ URL do trình duyệt redirect về từ cổng VNPay (`useSearchParams()`) để render thông báo bằng trực quan (`Thanh toán thành công` vs `Thanh toán không thành công`).

```tsx
// Trích xuất logic kiểm tra trạng thái tại PaymentResultPage.tsx (Lines 5-16)
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const amount = searchParams.get('vnp_Amount');
  const txnRef = searchParams.get('vnp_TxnRef');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const payDate = searchParams.get('vnp_PayDate');

  // Xác định giao dịch thành công strictly thông qua mã phản hồi VNPay
  const success =
    responseCode === '00' &&
    (transactionStatus === '00' || transactionStatus === null);
```

---

### 2.2. Kiểm tra Lỗ hổng P0 Backend: IoT Telemetry Authorization Block (`Section 2.3`)

#### a. Vấn đề kiến trúc ban đầu
- Annotation Method Security `@PreAuthorize` trên hai endpoint cung cấp dữ liệu cảm biến (`GET /api/iot/sensors/latest` và `GET /api/iot/sensors/history`) chỉ cho phép `ROLE_ADMIN`, `ROLE_MANAGER`, và `ROLE_GARDEN_STAFF`.
- **Rủi ro:** Khách hàng thuê vườn (`ROLE_CUSTOMER`) bị trả về mã lỗi `403 Forbidden` khi truy xuất dữ liệu môi trường thời gian thực (nhiệt độ, độ ẩm đất, ánh sáng, pH) của chính vườn mình đang thuê trên Dashboard.

#### b. Kết quả khắc phục & Xác minh tại `IoTSensorController.java`
- Đã tiêm chính xác role `ROLE_CUSTOMER` vào biểu thức bảo mật `@PreAuthorize` của cả 2 endpoint.
- Đã tiến hành dịch ngược và biên dịch lại toàn bộ module Backend bằng lệnh `mvn clean compile -DskipTests` (Trạng thái build: **BUILD SUCCESS**).

```java
// Trích xuất mã nguồn IoTSensorController.java (Lines 70-86)
@GetMapping("/sensors/latest")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MANAGER') or hasRole('ROLE_GARDEN_STAFF') or hasRole('ROLE_CUSTOMER')")
@Operation(summary = "Gia tri moi nhat tung loai cam bien theo device")
public ResponseEntity<List<SensorReadingResponseDTO>> getLatest(
        @Parameter(example = "arduino-greenhouse-01") @RequestParam String deviceId) {
    return ResponseEntity.ok(sensorReadingService.getLatestReadings(deviceId));
}

@GetMapping("/sensors/history")
@PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MANAGER') or hasRole('ROLE_GARDEN_STAFF') or hasRole('ROLE_CUSTOMER')")
@Operation(summary = "Lich su doc cam bien")
public ResponseEntity<List<SensorReadingResponseDTO>> getHistory(
        @RequestParam String deviceId,
        @RequestParam(required = false) ESensorType sensorType,
        @RequestParam(defaultValue = "50") int limit) {
    return ResponseEntity.ok(sensorReadingService.getHistory(deviceId, sensorType, limit));
}
```

---

### 2.3. Kiểm tra Hạng mục Kiểm chứng sâu (Regression Check): Booking Price Calculation (`Section 2.7`)

#### a. Vấn đề logic tiềm ẩn
- Nếu tính tổng giá trị hợp đồng thuê (`totalPrice`) bằng cách cộng tất cả các giao dịch (`transactions`) liên quan đến `rentalId`, hệ thống sẽ bị lỗi lạm phát số tiền (cộng dồn cả các lần thanh toán thất bại `FAILED`, hủy bỏ `CANCELLED` hoặc các mã giao dịch hết hạn `EXPIRED`).

#### b. Kết quả xác minh tại `GreenSlot-FrontEnd/src/utils/bookingAdapter.ts`
- Hàm `mapRentalHistory` đã áp dụng bộ lọc trạng thái giao dịch nghiêm ngặt:

```typescript
// Trích xuất logic tại bookingAdapter.ts (Lines 14-17)
const paidTransactions = dto.transactions?.filter(t => t.status === 'SUCCESS' || t.status === 'PAID') ?? [];
const totalPrice = paidTransactions.length > 0
  ? paidTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  : (Number(latestTx?.amount) || 0);
```
- **Đánh giá:** Logic trên đảm bảo chỉ những giao dịch thực sự đã nhận được callback xác nhận thanh toán thành công (`SUCCESS` / `PAID`) mới được tính vào tổng chi phí thực tế hiển thị cho người dùng.

---

## 3. KẾT LUẬN & KHUYẾN NGHỊ VẬN HÀNH (OPERATIONAL RECOMMENDATIONS)

1. **Chuẩn hóa luồng VNPay Callback trong môi trường Production:**
   - Đảm bảo tham số `vnp_IpnUrl` được cấu hình trong `VNPayUtils.java` trỏ đúng về domain thực tế (hoặc domain đường hầm Ngrok đang mở) để VNPay có thể gọi webhook ngầm xác nhận trạng thái đơn hàng tới Backend:
     `POST /api/payments/vnpay-ipn`
2. **Kiểm soát CORS & Security Group:**
   - Cấu hình `application.yml` phần `security.cors.allowed-origins` và `@CrossOrigin` trên các Controller cần khớp chính xác với địa chỉ gốc (`Origin`) của Frontend Deployment (Vercel / Localhost) để tránh chặn preflight request (`OPTIONS`).

---
*Báo cáo được xuất tự động sau quá trình rà soát và biên dịch mã nguồn trực tiếp.*
