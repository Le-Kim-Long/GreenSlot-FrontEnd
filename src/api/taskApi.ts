import apiClient from './axiosConfig';
import { uploadEvidenceImageToFirebase } from '../utils/firebaseUpload';
import { compressImage } from '../utils/imageCompression';
import type {
  GardeningTask,
  IssueReport,
  ServiceRequest,
  TaskStatusUpdate,
} from '../types/api';

export interface CreateTaskPayload {
  taskName: string;
  description: string;
  taskType: string;
  targetSlotId: number;
}

export interface EligibleHarvestRental {
  rentalId: number;
  pillarId?: number;
  pillarCode?: string;
  slotNumber: string;
  treeName: string;
  plantedAt?: string;
  pillarCodes?: string;
  harvestDays?: number;
  daysGrown?: number;
}

export const taskApi = {
  requestService: (data: ServiceRequest): Promise<GardeningTask> =>
    apiClient.post('/services/request', data).then(r => r.data),

  // Change '/tasks' to '/tasks/create'
  createTask: (data: CreateTaskPayload): Promise<GardeningTask> =>
    apiClient.post('/tasks/create', data).then(r => r.data),

  assignTask: (taskId: number, staffId: number): Promise<GardeningTask> =>
    apiClient.put(`/tasks/${taskId}/assign`, { staffId }).then(r => r.data),
    
  getAllTasks: (): Promise<any[]> =>
    apiClient.get('/tasks').then(r => r.data),

  getMyTasks: (): Promise<GardeningTask[]> =>
    apiClient.get('/tasks/my-tasks').then(r => r.data),

  // Công việc chưa ai nhận, cùng cơ sở với staff hiện tại — vd task Thu hoạch tự tạo
  getAvailableTasks: (): Promise<GardeningTask[]> =>
    apiClient.get('/tasks/available').then(r => r.data),

  // Staff tự nhận việc, không cần quản lý gán
  claimTask: (taskId: number): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/claim`).then(r => r.data),

  // Staff báo cho khách hàng biết cây đã sẵn sàng thu hoạch, để khách chọn tự thu hoạch hay nhờ staff
  notifyHarvestChoice: (taskId: number): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/notify-harvest`).then(r => r.data),

  // Danh sách ô đất đang có cây tại cơ sở của staff, để chọn báo thu hoạch sớm (chưa đủ ngày sinh trưởng)
  getEligibleEarlyHarvestRentals: (): Promise<EligibleHarvestRental[]> =>
    apiClient.get('/tasks/harvest/eligible-rentals').then(r => r.data),

  // Staff chủ động báo thu hoạch sớm cho 1 ô đất / trụ, không cần đợi hệ thống tự tạo task theo số ngày
  notifyEarlyHarvest: (payload: { rentalId: number; pillarId?: number; pillarCode?: string } | number): Promise<GardeningTask> => {
    const body = typeof payload === 'number' ? { rentalId: payload } : payload;
    return apiClient.post('/tasks/harvest/early', body).then(r => r.data);
  },

  updateTaskStatus: (taskId: number, data: TaskStatusUpdate): Promise<GardeningTask> =>
    apiClient.patch(`/tasks/${taskId}/status`, data).then(r => r.data),

  reportIssue: (taskId: number, data: IssueReport): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/report-issue`, data).then(r => r.data),

  // Thêm API upload hình ảnh bằng chứng (Client Firebase + Backend Fallback)
  uploadEvidenceImage: async (file: File): Promise<string> => {
    try {
      // 1. Thử upload trực tiếp qua Firebase Client SDK
      const firebaseUrl = await uploadEvidenceImageToFirebase(file);
      if (firebaseUrl) return firebaseUrl;
    } catch (err) {
      console.warn('Firebase client upload failed, falling back to Backend API:', err);
    }

    // 2. Fallback sang API Backend (/api/images/upload/evidence) — nén trước khi upload qua Vercel proxy
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    return apiClient.post('/images/upload/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data.publicUrl);
  },

  reviewTask: (taskId: number, data: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/review`, data).then(r => r.data),

  updateTaskEvidence: (taskId: number, evidenceImageUrl: string): Promise<GardeningTask> =>
    apiClient.patch(`/tasks/${taskId}/evidence`, { evidenceImageUrl }).then(r => r.data),
};