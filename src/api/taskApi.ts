import apiClient from './axiosConfig';
import type {
  GardeningTask,
  IssueReport,
  ServiceRequest,
  TaskAssignment,
  TaskStatusUpdate,
} from '../types/api';

export const taskApi = {
  requestService: (data: ServiceRequest): Promise<GardeningTask> =>
    apiClient.post('/services/request', data).then(r => r.data),

  assignTask: (data: TaskAssignment): Promise<GardeningTask> =>
    apiClient.post('/tasks/assign', data).then(r => r.data),

  getMyTasks: (): Promise<GardeningTask[]> =>
    apiClient.get('/tasks/my-tasks').then(r => r.data),

  updateTaskStatus: (taskId: number, data: TaskStatusUpdate): Promise<GardeningTask> =>
    apiClient.put(`/tasks/${taskId}/status`, data).then(r => r.data),

  reportIssue: (taskId: number, data: IssueReport): Promise<GardeningTask> =>
    apiClient.post(`/tasks/${taskId}/report-issue`, data).then(r => r.data),
};
