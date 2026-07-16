import apiClient from './axiosConfig';
import type {
  GardeningTask,
  IssueReport,
  ServiceRequest,
  TaskAssignment,
  TaskStatusUpdate,
} from '../types/api';

// ==========================================
// TASK API (Chính xác theo bạn cung cấp)
// ==========================================
export const taskApi = {
  requestService: (data: ServiceRequest): Promise<GardeningTask> =>
    apiClient.post('/services/request', data).then(r => r.data),

  assignTask: (data: TaskAssignment): Promise<GardeningTask> =>
    apiClient.post('/tasks/assign', data).then(r => r.data),

  getMyTasks: (): Promise<GardeningTask[]> =>
    apiClient.get('/tasks/my-tasks').then(r => r.data),

  updateTaskStatus: (taskId: number, data: TaskStatusUpdate): Promise<GardeningTask> =>
    apiClient.patch(`/tasks/${taskId}/status`, data).then(r => r.data),

  reportIssue: (taskId: number, data: IssueReport): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/report-issue`, data).then(r => r.data),
};

// ==========================================
// MỘT VÀI LƯU Ý VỀ TÍCH HỢP UI TASK MANAGEMENT
// ==========================================
// 1. Lấy danh sách toàn bộ Task cho Manager: 
// Vì taskApi chỉ có getMyTasks, bạn sẽ cần Backend cung cấp 1 API như `GET /manager/tasks` 
// để Manager xem được toàn bộ task. Tạm thời trong file TaskManagement.tsx, bạn có thể 
// mock dữ liệu (dữ liệu giả) hoặc gọi tạm `taskApi.getMyTasks()` để test UI.

// 2. Không có getGardeners:
// Trên giao diện gán việc (Modal Assign Task), dropdown chọn nhân viên hiện tại sẽ không có data. 
// Tạm thời, bạn có thể hardcode một vài ID nhân viên giả để test luồng Assign Task:
// const mockGardeners = [
//   { id: 1, name: 'Nguyễn Văn A (Gardener)' },
//   { id: 2, name: 'Trần Thị B (Gardener)' }
// ];