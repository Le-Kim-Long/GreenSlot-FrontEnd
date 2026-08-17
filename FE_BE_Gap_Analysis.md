# BÁO CÁO PHÂN TÍCH LỆCH PHA FRONTEND vs BACKEND (GAP ANALYSIS)

- **Ngày thực hiện:** 13/07/2026
- **Phương pháp:** Dynamic BE Audit → FE Cross-Reference Scan → Brutally Honest Gap Identification
- **BE Baseline:** 55 unique endpoint methods (74 route registrations) trên 11 Controller
- **FE Coverage:** 48 API functions (loại trừ trùng lặp `userApi` ↔ `adminApi`) trên 8 API files
- **Giọng văn:** Khách quan. Không khen. Chỉ ghi nhận sự thật.

---

## PHẦN 1: CÁC API BACKEND BỊ BỎ RƠI (ORPHANED BE ENDPOINTS)

Đây là danh sách các API đã được Backend triển khai **hoàn chỉnh** nhưng Frontend **hoàn toàn không gọi tới**. Đây là công sức phát triển bị lãng phí — hoặc là tính năng chưa được tích hợp.

### 1.1 Module IoT — 8/11 endpoints bị bỏ rơi (72.7% coverage gap)

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/iot/camera/{slotId}` | GET | ❌ **KHÔNG TỒN TẠI** trong `iotApi.ts` | **CRITICAL** |
| 2 | `/api/iot/sensors/thresholds` | POST | ❌ Không có `createThreshold()` | **HIGH** |
| 3 | `/api/iot/sensors/thresholds` | GET | ❌ Không có `getAllThresholds()` | **HIGH** |
| 4 | `/api/iot/sensors/thresholds/{id}` | GET | ❌ Không có `getThresholdById()` | MEDIUM |
| 5 | `/api/iot/sensors/thresholds/{id}` | PUT | ❌ Không có `updateThreshold()` | **HIGH** |
| 6 | `/api/iot/sensors/thresholds/{id}` | DELETE | ❌ Không có `deleteThreshold()` | **HIGH** |
| 7 | `/api/iot/sensors/data` | POST | ❌ (Đây là endpoint cho Arduino hardware, không cần FE) | N/A |
| 8 | `/api/iot/device/data` | POST | ❌ (Đây là endpoint cho ESP32 hardware, không cần FE) | N/A |

> **Tác động thực tế:** Toàn bộ hệ thống quản lý ngưỡng cảnh báo IoT (`SensorThreshold`) và luồng xem camera livestream đã được BE triển khai hoàn chỉnh (bao gồm cả cơ chế tự động gửi `Notification IOT_ALERT` cho khách hàng và nhân viên khi chỉ số vượt ngưỡng), nhưng **không ai trên FE có thể cấu hình ngưỡng hoặc xem camera**. Quản lý không có giao diện để thiết lập ngưỡng min/max cho cảm biến. Khách hàng thuê ô đất không có cách nào xem camera giám sát vườn.

### 1.2 Module Manager — 2 endpoints `DELETE` bị bỏ rơi

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/manager/service-categories/{id}` | DELETE | ❌ `managerApi.ts` không có `deleteServiceCategory()` | MEDIUM |
| 2 | `/api/manager/service-types/{id}` | DELETE | ❌ `managerApi.ts` không có `deleteServiceType()` | MEDIUM |

> **Tác động thực tế:** Quản lý có thể tạo và sửa danh mục/loại dịch vụ chăm sóc, nhưng **không thể xóa** chúng từ giao diện. Dữ liệu rác sẽ tích tụ trong hệ thống.

### 1.3 Module Task — 1 endpoint bị bỏ rơi

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/tasks/{taskId}/assign` | PATCH/PUT/POST | ❌ `taskApi.ts` không có `assignTaskById()` | **HIGH** |

> **Tác động thực tế:** BE hỗ trợ cả tạo nhiệm vụ mới kèm phân công (`POST /tasks/assign`) LẪN phân công lại nhân viên cho nhiệm vụ đã tồn tại (`PATCH /tasks/{taskId}/assign`). FE **chỉ có** `assignTask()` (tạo mới) mà **không có** `assignTaskById()` (phân công lại). Quản lý không thể re-assign task `SERVICE_REQUEST` của khách hàng vì task đó chỉ có thể được tạo bởi khách hàng, và BE **cấm** quản lý tạo task loại `SERVICE_REQUEST`.

### 1.4 Module User — 1 endpoint bị bỏ rơi

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/users/profile` | GET | ❌ `userApi.ts` chỉ có `updateProfile()` (PATCH), **không có** `getProfile()` (GET) | **HIGH** |

> **Tác động thực tế:** Trang `ProfilePage.tsx` có tồn tại trong FE routing nhưng **không có cách nào lấy dữ liệu profile từ server để hiển thị**. Hoặc dữ liệu profile đang được lấy từ JWT token cục bộ (nếu có `fullName`, `email` trong token payload) — nhưng điều này vi phạm nguyên tắc single source of truth vì dữ liệu JWT sẽ trở nên stale sau khi user cập nhật profile.

### 1.5 Module Dashboard — 3 endpoints "zombie"

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/dashboard/public` | GET | ⚠️ Có trong `dashboardApi.ts` nhưng **không được gọi bởi component nào** | LOW |
| 2 | `/api/dashboard/customer` | GET | ⚠️ Có trong `dashboardApi.ts` nhưng **không được gọi bởi component nào** | LOW |
| 3 | `/api/dashboard/staff` | GET | ⚠️ Có trong `dashboardApi.ts` nhưng **không được gọi bởi component nào** | LOW |

> **Tác động thực tế:** Các API function đã được khai báo nhưng không kết nối vào bất kỳ giao diện nào. Đây là dead code ở phía FE.

### 1.6 Module Admin — 1 endpoint bị bỏ rơi

| # | BE Endpoint | HTTP Method | FE Status | Mức độ |
|:--|:---|:---|:---|:---|
| 1 | `/api/admin/global-content/{id}` | DELETE | ❌ BE có thể chưa triển khai DELETE, nhưng FE cũng không có | LOW |

---

## PHẦN 2: LỆCH PHA LOGIC NGHIỆP VỤ (BUSINESS LOGIC MISMATCHES)

### 2.1 🔴 CRITICAL: FE gọi VNPay IPN từ browser — SAI KIẾN TRÚC

**File lỗi:** [bookingApi.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/api/bookingApi.ts) — dòng 37-38

```typescript
notifyVnPayResult: (queryString: string): Promise<{ RspCode: string; Message: string }> =>
    apiClient.get(`/payments/vnpay-ipn${queryString}`).then(r => r.data),
```

**Sự thật BE:** Endpoint `/api/payments/vnpay-ipn` được thiết kế để **chỉ** nhận callback từ máy chủ VNPay (server-to-server). Nó xử lý chữ ký HMAC-SHA512, cập nhật trạng thái `SlotRental` và `GardenSlot`, và trả về JSON `{"RspCode":"00","Message":"Confirm Success"}` cho VNPay.

**Vấn đề:** FE đang gọi endpoint này **từ browser** của người dùng bằng `apiClient.get()`, nghĩa là yêu cầu sẽ mang theo JWT Bearer token (do `axiosConfig.ts` auto-attach). Điều này:
1. Không giống call từ VNPay (VNPay không gửi JWT)
2. Có thể kích hoạt xử lý trùng lặp (double processing) nếu VNPay đã gọi IPN trước đó, dẫn đến response `RspCode = "02" (Order already confirmed)`
3. Tệ nhất: Nếu VNPay chưa gọi IPN (do delay mạng) mà FE gọi trước với đầy đủ query params, nó có thể kích hoạt chuyển trạng thái `ACTIVE` không chính thống

**Cách đúng:** FE chỉ nên đọc query params từ `/payment-result` URL redirect (`vnp_ResponseCode`, `vnp_TransactionStatus`) để hiển thị kết quả thành công/thất bại cho người dùng. **KHÔNG** nên gọi lại endpoint IPN.

---

### 2.2 🟠 HIGH: `bookingApi.bookSlot()` gửi field thừa `startTime`

**File lỗi:** [bookingApi.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/api/bookingApi.ts) — dòng 20-21

**Sự thật BE (`BookingRequestDTO`):** Có field `startTime: LocalDateTime` (optional). Nếu `null`, BE mặc định dùng `LocalDateTime.now()`.

**Vấn đề:** Từ FE type definition, `BookingRequest` interface có thể bao gồm `startTime`. Nếu FE gửi `startTime` do người dùng tự chọn, cần đảm bảo format đúng chuẩn ISO-8601 (`yyyy-MM-ddTHH:mm:ss`). Nếu không, Spring sẽ ném `HttpMessageNotReadableException`. Đây không phải bug hiện tại nhưng là **bom nổ chậm** khi FE quyết định cho phép khách chọn ngày bắt đầu thuê.

---

### 2.3 🟠 HIGH: FE thiếu xử lý cơ chế phân quyền IoT `/sensors/latest` và `/sensors/history`

**Sự thật BE:** Hai endpoint `GET /api/iot/sensors/latest` và `GET /api/iot/sensors/history` có annotation:
```java
@PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_MANAGER') or hasRole('ROLE_GARDEN_STAFF')")
```
**Nghĩa là CUSTOMER KHÔNG CÓ QUYỀN truy cập.**

**Vấn đề FE:** [IoTMonitoringPage.tsx](file:///d:/SWP490/GreenSlot-FrontEnd/src/pages/customer/IoTMonitoringPage.tsx) nằm trong route `/dashboard/customer/monitoring` dành cho `ROLE_CUSTOMER`. Khi trang này gọi `iotApi.getLatest()` và `iotApi.getHistory()`, BE sẽ trả về **403 Forbidden**. Trang IoT Monitoring cho khách hàng hiện tại **không thể hoạt động** trừ khi:
- BE sửa lại `@PreAuthorize` để cho phép `ROLE_CUSTOMER` (có vẻ hợp lý vì khách hàng cần xem dữ liệu cảm biến trên ô đất mình thuê)
- Hoặc FE dùng một endpoint khác (hiện không tồn tại)

---

### 2.4 🟡 MEDIUM: FE không tôn trọng ràng buộc máy trạng thái nhiệm vụ chăm sóc

**Sự thật BE (`GardeningTaskServiceImpl`):**
- Chuyển trạng thái bắt buộc tuần tự: `PENDING → IN_PROGRESS → COMPLETED`
- **NGHIÊM CẤM**: `PENDING → COMPLETED` (bỏ qua `IN_PROGRESS`)
- Khi chuyển sang `COMPLETED`, trường `evidenceImageUrl` **bắt buộc phải có giá trị** (non-null, non-blank)
- Task `COMPLETED` bị khóa bất biến, mọi thay đổi đều bị từ chối

**Vấn đề FE tiềm ẩn:** Cần xác minh rằng UI của `GardenStaffDashboard` có thi hành đúng các ràng buộc này:
- Nút "Hoàn thành" chỉ xuất hiện khi task đang ở `IN_PROGRESS` (không phải `PENDING`)
- Form upload ảnh bằng chứng bắt buộc trước khi cho phép submit `COMPLETED`
- Ẩn mọi nút chỉnh sửa khi task đã `COMPLETED`

Nếu FE không kiểm tra phía client, BE sẽ trả lỗi `400 Bad Request` nhưng trải nghiệm người dùng sẽ rất tệ (nhân viên nhấn nút → lỗi → không hiểu vì sao).

---

### 2.5 🟡 MEDIUM: `managerApi` mapping field inconsistency

**File lỗi:** [managerApi.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/api/managerApi.ts) — dòng 4-23

FE sử dụng các hàm `mapServiceCategory()` và `mapServiceType()` với fallback pattern `item.name ?? item.categoryName` / `item.serviceName ?? item.name`. Điều này cho thấy FE team **không chắc chắn** BE trả về field nào (`name` hay `categoryName`, `serviceName` hay `name`).

**Sự thật BE:**
- `ServiceCategoryDTO` trả về field `categoryName` (không phải `name`)
- `ServiceTypeDTO` trả về field `serviceName` (không phải `name`)

Mapping `any` type với fallback logic này hoạt động nhưng là **mùi code** (code smell) — nó che giấu bug tiềm ẩn và cho thấy FE chưa đồng bộ contract với BE.

---

### 2.6 🟡 MEDIUM: Trùng lặp khai báo API giữa `userApi.ts` và `adminApi.ts`

[userApi.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/api/userApi.ts) khai báo lại `getUsers()`, `updateUserStatus()`, `updateUserRoles()` — **trùng hoàn toàn** với [adminApi.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/api/adminApi.ts). Hai module gọi cùng endpoint nhưng có thể có type interface khác nhau, dẫn tới rủi ro bảo trì khi một bên được cập nhật mà bên còn lại thì không.

---

### 2.7 🔴 CRITICAL: Tính sai tổng tiền hợp đồng (`totalPrice`) khi gia hạn hoặc hủy gia hạn

**File lỗi:** [bookingAdapter.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/utils/bookingAdapter.ts) — dòng 11 (trước khi sửa)

**Sự thật BE (`BookingServiceImpl.extendRental` & `getRentalHistory`):**
- Khi người dùng nhấn nút **"Gia hạn"**, BE tạo ra 1 giao dịch mới (`PaymentTransaction`) với trạng thái `PENDING` (chờ thanh toán qua VNPay).
- Khi FE gọi `GET /api/bookings/my-rentals`, BE trả về danh sách `transactions` của hợp đồng, bao gồm cả giao dịch `SUCCESS` (thuê ban đầu) và giao dịch `PENDING` (hoặc `FAILED` nếu hủy/chưa thanh toán gia hạn).

**Vấn đề FE:**
- Hàm `mapRentalHistory()` trong `bookingAdapter.ts` tính `totalPrice` bằng cách **cộng dồn toàn bộ số tiền (`t.amount`) của tất cả giao dịch** (`dto.transactions?.reduce(...)`) mà không kiểm tra trạng thái (`t.status === 'SUCCESS' || t.status === 'PAID'`).
- **Hậu quả:** Mỗi lần người dùng nhấn **"Gia hạn"** rồi **hủy** (hoặc tắt trang VNPay), một giao dịch `PENDING`/`FAILED` trị giá hợp đồng được thêm vào danh sách. FE lập tức cộng dồn giao dịch chưa thanh toán này vào `totalPrice`, khiến tổng tiền hiển thị trên card (`MyRentalsPage.tsx`) bị **cộng thêm khống** (từ `1.000.000đ` lên `2.000.000đ`, `3.000.000đ`...) dù người dùng không hề thanh toán và hạn hợp đồng không đổi!

**Cách khắc phục (Đã thực hiện ngay tại [bookingAdapter.ts](file:///d:/SWP490/GreenSlot-FrontEnd/src/utils/bookingAdapter.ts#L11-L17)):**
- Sửa `totalPrice` chỉ cộng dồn các giao dịch có trạng thái `SUCCESS` hoặc `PAID`.
- Nếu hợp đồng mới tạo (chưa có giao dịch `SUCCESS`), fallback lấy số tiền của giao dịch ban đầu (`latestTx?.amount`). Tiền hợp đồng giữ nguyên tuyệt đối cho đến khi giao dịch gia hạn thực sự thành công.

---

## PHẦN 3: THIẾU SÓT GIAO DIỆN MÀN HÌNH (MISSING UI / PAGES)

Dựa trên danh sách feature BE đã triển khai, đây là các màn hình/component mà FE team **BẮT BUỘC** phải xây dựng để đạt feature parity:

### 3.1 🔴 CRITICAL — Trang/Component chưa tồn tại

| # | Màn hình cần xây | BE Endpoints liên quan | Vai trò sử dụng | Mô tả |
|:--|:---|:---|:---|:---|
| 1 | **`ThresholdManagementPage`** | `POST/GET/PUT/DELETE /api/iot/sensors/thresholds` | Manager | Giao diện CRUD để quản lý ngưỡng cảnh báo IoT (min/max) cho từng loại cảm biến trên từng thiết bị. Hiện quản lý không có cách nào thiết lập ngưỡng. |
| 2 | **Camera Livestream Component** | `GET /api/iot/camera/{slotId}` | Customer, Staff, Manager | Component hiển thị luồng camera livestream (`cameraStreamUrl`) cho ô đất. BE đã triển khai bảo mật (chỉ chủ hợp đồng ACTIVE hoặc staff/manager mới xem được). FE chưa gọi endpoint này. |
| 3 | **Task Assignment Panel (Re-assign)** | `PATCH /api/tasks/{taskId}/assign` | Manager | Giao diện cho phép Manager phân công lại nhân viên cho task đã tồn tại (đặc biệt quan trọng cho `SERVICE_REQUEST` do khách hàng tạo). |

### 3.2 🟠 HIGH — Chức năng thiếu trên trang hiện có

| # | Trang hiện có | Chức năng thiếu | BE Endpoint | Mô tả |
|:--|:---|:---|:---|:---|
| 1 | `ServiceManagement` | Nút **Xóa** danh mục dịch vụ | `DELETE /api/manager/service-categories/{id}` | Trang hiện chỉ có Thêm/Sửa, không có Xóa. |
| 2 | `ServiceManagement` | Nút **Xóa** loại dịch vụ | `DELETE /api/manager/service-types/{id}` | Tương tự như trên. |
| 3 | `ProfilePage` | **Hiển thị** dữ liệu profile từ server | `GET /api/users/profile` | Trang cần fetch dữ liệu profile thực tế từ BE thay vì dùng dữ liệu cũ từ JWT token. |

### 3.3 🟡 MEDIUM — Trang dành cho vai trò `ROLE_GARDEN_STAFF`

| # | Vấn đề | Chi tiết |
|:--|:---|:---|
| 1 | **Thiếu trang quản lý nhiệm vụ riêng cho Garden Staff** | Hiện FE có `GardenStaffDashboard` và route `/dashboard/garden-staff/monitoring`. Nhưng **không có route riêng** cho `/dashboard/garden-staff/tasks` (trang `MyTasksPage`). Nhân viên chăm sóc cần một trang rõ ràng hiển thị danh sách công việc được phân công (`GET /api/tasks/my-tasks`), cho phép cập nhật tiến độ (`PATCH /api/tasks/{id}/status`), upload ảnh bằng chứng, và báo cáo sự cố (`POST /api/tasks/{id}/report-issue`). |
| 2 | **Thiếu trang thông báo cho Garden Staff** | Staff không có route `/dashboard/garden-staff/notifications` để xem các cảnh báo `IOT_ALERT` và thông báo phân công nhiệm vụ. |

### 3.4 🟡 MEDIUM — Trang dành cho vai trò `ROLE_ADMIN`

| # | Vấn đề | Chi tiết |
|:--|:---|:---|
| 1 | **Thiếu trang quản lý Global Content** | Route `/dashboard/admin/global-content` không tồn tại trong `App.tsx`. Admin có API đầy đủ (`GET/POST/PUT /api/admin/global-content`) nhưng không có giao diện tương ứng. |
| 2 | **Thiếu trang thông báo cho Admin** | Không có route thông báo riêng cho Admin. |

### 3.5 🟢 LOW — Staff/Manager thiếu trang IoT Monitoring và Task Management

| # | Vấn đề | Chi tiết |
|:--|:---|:---|
| 1 | **Thiếu trang IoT Monitoring cho Manager** | Route `/dashboard/staff/iot-monitoring` chưa tồn tại. Manager cần xem dữ liệu cảm biến để quyết định thiết lập ngưỡng. |
| 2 | **Thiếu trang Task Management cho Manager** | Route `/dashboard/staff/tasks` chưa tồn tại. Manager cần xem danh sách toàn bộ công việc để phân công và theo dõi tiến độ. FE hiện có `assignTask()` trong `taskApi.ts` nhưng **không có trang nào sử dụng nó**. |

---

## TÓM TẮT THỐNG KÊ TỔNG HỢP

| Chỉ số | Giá trị |
|:---|:---|
| Tổng số unique BE endpoints | **55** |
| Tổng số FE API functions (loại trừ trùng lặp) | **~48** |
| Số BE endpoints bị FE bỏ rơi hoàn toàn | **12** (22%) |
| Số Business Logic Mismatches | **7** (2 CRITICAL, 2 HIGH, 3 MEDIUM) |
| Số trang/component FE cần xây mới | **3** CRITICAL + **3** HIGH + **4** MEDIUM |
| Dead code trên FE (API khai báo nhưng không dùng) | `dashboardApi.ts` (3 functions), trùng lặp `userApi.ts` (3 functions) |

### Ma trận mức độ ưu tiên hành động

| Ưu tiên | Hành động | Lý do |
|:---|:---|:---|
| 🔴 **P0 — Ngay lập tức** | Sửa `bookingApi.notifyVnPayResult()` — Ngừng gọi IPN từ browser | Rủi ro double-processing thanh toán, sai kiến trúc bảo mật |
| 🔴 **P0 — Ngay lập tức** | Sửa `mapRentalHistory()` trong `bookingAdapter.ts` | Tránh lỗi tính khống `totalPrice` khi nhấn gia hạn hoặc hủy gia hạn (`CRITICAL 2.7`) |
| 🔴 **P0 — Ngay lập tức** | Xác minh `@PreAuthorize` trên IoT endpoints cho `ROLE_CUSTOMER` | Customer IoT Monitoring page hiện **100% bị block bởi 403** |
| 🟠 **P1 — Sprint hiện tại** | Xây `ThresholdManagementPage` + Camera component | Feature BE đã sẵn sàng, FE hoàn toàn trống |
| 🟠 **P1 — Sprint hiện tại** | Thêm `assignTaskById()` vào `taskApi.ts` + Task Management Page | Manager không thể re-assign `SERVICE_REQUEST` tasks |
| 🟠 **P1 — Sprint hiện tại** | Thêm `getProfile()` vào `userApi.ts` + cập nhật `ProfilePage` | Profile đang dùng dữ liệu stale từ JWT |
| 🟡 **P2 — Sprint tiếp** | Thêm `deleteServiceCategory/Type` vào FE | Quản lý không thể dọn dẹp dữ liệu |
| 🟡 **P2 — Sprint tiếp** | Xây trang tasks/notifications cho `ROLE_GARDEN_STAFF` | Nhân viên chưa có giao diện làm việc hoàn chỉnh |
| 🟡 **P2 — Sprint tiếp** | Xây trang Global Content cho Admin | Admin feature incomplete |
