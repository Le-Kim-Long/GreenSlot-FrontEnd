import apiClient from './axiosConfig';
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

  updateTaskStatus: (taskId: number, data: TaskStatusUpdate): Promise<GardeningTask> =>
    apiClient.patch(`/tasks/${taskId}/status`, data).then(r => r.data),

  reportIssue: (taskId: number, data: IssueReport): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/report-issue`, data).then(r => r.data),

  // Thêm API upload hình ảnh bằng chứng
  uploadEvidenceImage: (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/images/upload/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data.publicUrl); // Trả về trực tiếp chuỗi URL để dễ sử dụng
  },
};