# GreenSlot FrontEnd — Kế hoạch tích hợp API Backend (GreeenSlot)

> **Chỉ implement trên `GreenSlot-FrontEnd`.** Backend `GreeenSlot` dùng làm reference — **không sửa code BE**.

---

## 1. Tổng quan hệ thống

| Thành phần | Công nghệ | Base URL |
|---|---|---|
| Backend | Spring Boot 3, JWT, VNPay, PostgreSQL | `/api/*` |
| Frontend | React 18, Vite, Axios, Tailwind | `VITE_API_URL` → cần kết thúc bằng `/api` |

### Vai trò Backend (`ERole`)

| Role BE | Mô tả | FE role đề xuất |
|---|---|---|
| `ROLE_CUSTOMER` | Khách thuê ô vườn | `customer` |
| `ROLE_GARDEN_STAFF` | Nhân viên vườn | `garden_staff` |
| `ROLE_LOCATION_MANAGER` | Quản lý cơ sở | `location_manager` |
| `ROLE_MANAGER` | Quản lý kinh doanh (doanh thu) | `manager` |
| `ROLE_ADMIN` | Quản trị hệ thống | `admin` |

> **Lưu ý:** FE hiện có role `owner` (chủ vườn) **không tồn tại** trong BE. Các trang `/dashboard/owner/*` dùng mock data — cần **loại bỏ hoặc ẩn** cho đến khi BE có module tương ứng.

---

## 2. Ma trận API ↔ Frontend

### 2.1 Authentication — `/api/auth`

| Method | Endpoint | Auth | Request | Response | FE status |
|---|---|---|---|---|---|
| POST | `/login` | Public | `{ username, password }` | `JwtResponseDTO` | ✅ Done |
| POST | `/register` | Public | `SignupRequestDTO` | `{ message }` | ⚠️ Gửi `roles` thừa (BE luôn gán CUSTOMER) |
| POST | `/forgot-password` | Public | `{ email }` | `{ message, resetToken: null }` | ✅ Done |
| POST | `/reset-password` | Public | `{ token, newPassword }` | `{ message }` | ✅ Done |

**Cần làm:**
- [ ] Sửa `AuthContext`: map đủ 5 role BE → FE
- [ ] Bỏ chọn role khi đăng ký (hoặc chỉ hiển thị thông báo "mặc định Khách hàng")
- [ ] Sửa `VITE_API_URL` = `.../api` (hiện thiếu prefix `/api`)

---

### 2.2 Booking & Thanh toán — `/api/bookings`, `/api/payments`

| Method | Endpoint | Auth | Mô tả | FE status |
|---|---|---|---|---|
| GET | `/bookings/available?locationId=` | **Authenticated** | Danh sách ô trống | ⚠️ Gọi từ trang public `/gardens` → 401 |
| POST | `/bookings/book` | `ROLE_CUSTOMER` | Tạo rental + URL VNPay | ✅ Done |
| POST | `/bookings/extend` | `ROLE_CUSTOMER` | Gia hạn + URL VNPay | ⚠️ Sai field: FE gửi `bookingId/additionalMonths`, BE cần `rentalId/durationInMonths` |
| GET | `/bookings/history` | `ROLE_CUSTOMER` | Lịch sử thuê + giao dịch | ⚠️ Sai mapping response |
| GET | `/payments/vnpay-ipn` | Public (VNPay) | IPN callback | N/A (server-side) |

**Response `RentalHistoryDTO` (BE):**
```json
{
  "rentalId": 1,
  "slotNumber": "A-01",
  "pillarCode": "P1",
  "locationName": "...",
  "locationAddress": "...",
  "startTime": "2025-01-01T00:00:00",
  "endTime": "2025-06-01T00:00:00",
  "rentalStatus": "ACTIVE",
  "transactions": [{ "id", "amount", "vnpTxnRef", "paymentDate", "status" }]
}
```

**Cần làm:**
- [ ] Thêm adapter map `RentalHistoryDTO` → `BookingHistory` FE
- [ ] Sửa `extendBooking` payload
- [ ] Redirect VNPay từ `BookingResponse.paymentUrl` (book + extend)
- [ ] Trang `/gardens`: yêu cầu login hoặc BE mở public cho `/available` (đề xuất: login trước khi xem)
- [ ] Trang **Lịch sử thanh toán** customer: derive từ `transactions[]` trong history

---

### 2.3 Quản lý kinh doanh — `/api/manager`

| Nhóm | Endpoints | Auth | FE status |
|---|---|---|---|
| Locations | CRUD `/locations`, `/locations/{id}` | `LOCATION_MANAGER` \| `MANAGER` | ✅ Done |
| Pillars | CRUD `/pillars` |同上 | ✅ Done |
| Slots | CRUD `/slots` |同上 | ✅ Done |
| Service Categories | CRUD `/service-categories` |同上 | ✅ Done |
| Service Types | CRUD `/service-types` |同上 | ✅ Done |
| Vận hành | GET `/active-rentals` |同上 | ✅ Done |
| Doanh thu | GET `/analytics/revenue?startDate&endDate` | **`ROLE_MANAGER` only** | ✅ Done (staff dashboard) |

**Cần làm:**
- [ ] Phân quyền FE: `location_manager` vs `manager` (revenue chỉ cho MANAGER)
- [ ] Thêm filter `locationId` cho trang slots/pillars nếu cần
- [ ] Hiển thị đúng field `ActiveRentalDTO` (username, fullName, startTime/endTime)

---

### 2.4 Gardening Tasks (Dịch vụ chăm sóc) — `/api`

| Method | Endpoint | Auth | Mô tả | FE status |
|---|---|---|---|---|
| POST | `/services/request` | `ROLE_CUSTOMER` | Yêu cầu dịch vụ cho slot đang thuê | ❌ Mock |
| POST | `/tasks/assign` | `ROLE_LOCATION_MANAGER` | Phân công task | ❌ Chưa có |
| GET | `/tasks/my-tasks` | `ROLE_GARDEN_STAFF` | Task của nhân viên | ❌ Chưa có |
| PUT | `/tasks/{id}/status` | `ROLE_GARDEN_STAFF` | Cập nhật tiến độ | ❌ Chưa có |
| POST | `/tasks/{id}/report-issue` | `ROLE_GARDEN_STAFF` | Báo cáo sự cố | ❌ Chưa có |

**Request `ServiceRequestDTO`:** `{ slotId, serviceTypeId, description? }`

**Task status:** `PENDING` → `IN_PROGRESS` → `COMPLETED` (cần `evidenceImageUrl` khi COMPLETED)

**Task type:** `SERVICE_REQUEST`, `MAINTENANCE`, `CLEANING`

**Cần làm:**
- [ ] Tạo `src/api/taskApi.ts`
- [ ] Refactor `CareServicesPage`: load service types từ manager API (public endpoint không có → dùng categories/types qua customer flow hoặc endpoint riêng)
- [ ] Customer: form request với slot ACTIVE + serviceTypeId
- [ ] Manager: trang **Phân công task** (`TaskAssignmentPage`)
- [ ] Garden Staff: dashboard **Công việc của tôi** (`MyTasksPage`)

---

### 2.5 Admin — `/api/admin`

| Method | Endpoint | Mô tả | FE status |
|---|---|---|---|
| GET | `/users?page&size` | Danh sách user (Page) | ❌ Mock |
| PUT | `/users/{id}/authorities` | Cập nhật roles | ❌ Mock |
| PUT | `/users/{id}/status` | Bật/tắt tài khoản | ❌ Mock |
| GET | `/audit-logs?startDate&endDate` | Nhật ký hệ thống | ❌ Chưa có |
| POST/PUT/GET | `/global-content` | Thông báo / cấu hình | ❌ Chưa có |

**Cần làm:**
- [ ] Tạo `src/api/adminApi.ts`
- [ ] Wire `UserManagementPage`: pagination, edit roles, toggle enabled
- [ ] Trang `AuditLogsPage`
- [ ] Trang `GlobalContentPage` (ANNOUNCEMENT / CONFIG)
- [ ] Refactor `AdminDashboard`: stats từ API thật

---

### 2.6 IoT Sensors — `/api/iot/sensors`

| Method | Endpoint | Auth | Mô tả | FE status |
|---|---|---|---|---|
| POST | `/data` | Header `X-IoT-Api-Key` | Arduino gửi data | N/A (hardware) |
| GET | `/latest?deviceId=` | Admin/Manager/GardenStaff | Giá trị mới nhất | ⚠️ Customer không có quyền |
| GET | `/history?deviceId&sensorType&limit` |同上 | Lịch sử | ⚠️同上 |
| GET | `/types` | Public | Loại cảm biến | ✅ API có, chưa dùng |

**Sensor types hiện tại BE:** `SOIL_MOISTURE`, `PH` (không phải TEMPERATURE/HUMIDITY như UI mock)

**Cần làm:**
- [ ] Đồng bộ UI IoT với `ESensorType` thực tế của BE
- [ ] Liên kết `deviceId` với `Pillar`/`Slot` (cần field BE hoặc mapping config)
- [ ] Phân quyền: IoT monitoring cho staff; customer xem qua slot đang thuê (cần BE mở endpoint hoặc proxy)
- [ ] Dùng `iotApi.getTypes()` render dynamic metrics

---

### 2.7 Dashboard placeholder — `/api/dashboard`

| Endpoint | Auth | FE status |
|---|---|---|
| GET `/public` | Public | ❌ Unused |
| GET `/customer` | CUSTOMER | ❌ Unused |
| GET `/staff` | Admin/Manager/GardenStaff | ❌ Unused |

> Endpoints chỉ trả string placeholder — **không dùng** cho UI production. Dashboard nên aggregate từ các API domain ở trên.

---

## 3. Kiến trúc Frontend đề xuất

```
src/
├── api/
│   ├── axiosConfig.ts      # baseURL + JWT interceptor
│   ├── authApi.ts          ✅
│   ├── bookingApi.ts       ⚠️ fix types
│   ├── managerApi.ts       ✅
│   ├── taskApi.ts          🆕
│   ├── adminApi.ts         🆕
│   └── iotApi.ts           ⚠️ align sensor types
├── types/
│   ├── index.ts            # legacy mock types
│   └── api.ts              🆕 DTOs khớp BE
├── utils/
│   ├── roleMap.ts          🆕 BE role ↔ FE role
│   └── bookingAdapter.ts   🆕 RentalHistoryDTO mapper
├── pages/
│   ├── customer/           ⚠️ bỏ mockData
│   ├── staff/              ✅ gần hoàn chỉnh
│   ├── garden-staff/       🆕 MyTasks, ReportIssue
│   ├── admin/              ❌ wire API
│   └── owner/              🚫 deprecate (no BE)
```

---

## 4. Lộ trình implement (theo phase)

### Phase 0 — Hạ tầng (P0, ~1 ngày)

1. Sửa `.env`: `VITE_API_URL=https://greenslot-backend.onrender.com/api`
2. Tạo `types/api.ts` — DTOs chuẩn BE
3. Tạo `utils/roleMap.ts` — map role + ProtectedRoute
4. Sửa `AuthContext` role mapping
5. Response interceptor: 401 → logout + redirect login

### Phase 1 — Sửa tích hợp đã có (P0, ~1–2 ngày)

1. Fix `bookingApi`: extend payload, history adapter, VNPay redirect
2. Fix `MyRentalsPage`, `GardenDetailPage` theo DTO mới
3. `CustomerDashboard` → dùng `bookingApi.getHistory()` thay mock
4. Public `/gardens` → redirect login nếu 401

### Phase 2 — Gardening Tasks (P1, ~2–3 ngày)

1. `taskApi.ts` — 5 endpoints
2. Refactor `CareServicesPage` — request service thật
3. `TaskAssignmentPage` cho location_manager (trong staff area)
4. `MyTasksPage` + `TaskDetailPage` cho garden_staff
5. Routes + nav mới theo role

### Phase 3 — Admin module (P1, ~2 ngày)

1. `adminApi.ts`
2. Wire `UserManagementPage`
3. `AuditLogsPage`, `GlobalContentPage`
4. Refactor `AdminDashboard`

### Phase 4 — IoT & Polish (P2, ~1–2 ngày)

1. Dynamic sensor UI từ `/iot/sensors/types`
2. Role-based IoT access
3. Trang payment history từ rental transactions
4. Loading/error states thống nhất
5. Loại bỏ `mockData.ts` dependencies

### Phase 5 — Dọn dẹp (P3)

1. Ẩn/xóa Owner dashboard (không có BE)
2. Cập nhật Landing/Pricing/Services lấy data thật (locations, service types)
3. E2E test checklist

---

## 5. Routing đề xuất (theo role)

| Role FE | Dashboard path | Modules |
|---|---|---|
| `customer` | `/dashboard/customer` | rentals, care, payments |
| `garden_staff` | `/dashboard/garden-staff` | my-tasks, iot |
| `location_manager` | `/dashboard/staff` | locations, pillars, slots, services, rentals, tasks |
| `manager` | `/dashboard/staff` | + revenue analytics |
| `admin` | `/dashboard/admin` | users, audit, content |

---

## 6. Checklist kiểm thử

- [ ] Login/logout/register/forgot/reset với tài khoản thật
- [ ] Customer: browse slots → book → VNPay → history ACTIVE
- [ ] Customer: extend rental → VNPay
- [ ] Customer: request care service cho slot ACTIVE
- [ ] Location Manager: CRUD location/pillar/slot/service
- [ ] Location Manager: assign task cho garden staff
- [ ] Garden Staff: xem task, update status, report issue
- [ ] Manager: xem revenue analytics
- [ ] Admin: paginate users, change roles, disable user
- [ ] Admin: audit logs, global content CRUD
- [ ] IoT: latest/history với deviceId hợp lệ
- [ ] 401/403 hiển thị thông báo đúng

---

## 7. Known gaps (BE không sửa — chỉ workaround FE)

> **Quy tắc:** Không thay đổi `GreeenSlot` (BE). Mọi giới hạn API xử lý phía `GreenSlot-FrontEnd`.

| # | Giới hạn BE | Workaround FE |
|---|---|---|
| 1 | `/bookings/available` yêu cầu JWT | Trang `/gardens` bắt đăng nhập trước khi gọi API |
| 2 | `RentalHistoryDTO` không có `slotId` | `slotCache.ts` — lưu `slotNumber→slotId` khi đặt thuê |
| 3 | Customer không đọc `/manager/service-types` | Form nhập thủ công `serviceTypeId` + thông báo |
| 4 | Customer không xem IoT `/latest` | Trang IoT hiển thị cảnh báo; staff dùng `/dashboard/garden-staff/monitoring` |
| 5 | Không có API list task của customer | Chưa có UI theo dõi task (chỉ gửi request) |
| 6 | Role `owner` không tồn tại | Ẩn `/dashboard/owner`, redirect về `/gardens` |

---

## 8. Trạng thái hiện tại (snapshot)

| Module | API layer | UI wired | Ghi chú |
|---|---|---|---|
| Auth | ✅ | ✅ | Role map sai |
| Booking | ⚠️ | ⚠️ | Field mismatch |
| Manager | ✅ | ✅ | Staff pages OK |
| Tasks | ❌ | ❌ | Toàn mock |
| Admin | ❌ | ❌ | Toàn mock |
| IoT | ✅ | ⚠️ | Role + sensor mismatch |
| Owner | N/A | Mock | Không có BE |
| Payment IPN | N/A | N/A | Server only |

---

*Tạo: 2026-06-26 · Dựa trên phân tích source `GreeenSlot/src/main/java/swp490/greeenslot/controller/*`*
