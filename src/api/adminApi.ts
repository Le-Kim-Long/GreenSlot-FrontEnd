import apiClient from './axiosConfig';
import type {
  AuditLog,
  GlobalContent,
  PageResponse,
  UserAdmin,
} from '../types/api';

export const adminApi = {
  getUsers: (page = 0, size = 20): Promise<PageResponse<UserAdmin>> =>
    apiClient.get('/admin/users', { params: { page, size } }).then(r => r.data),

  updateUserAuthorities: (id: number, roles: string[]): Promise<UserAdmin> =>
    apiClient.put(`/admin/users/${id}/authorities`, { roles }).then(r => r.data),

  updateUserStatus: (id: number, enabled: boolean): Promise<UserAdmin> =>
    apiClient.put(`/admin/users/${id}/status`, { enabled }).then(r => r.data),

  getAuditLogs: (startDate?: string, endDate?: string): Promise<AuditLog[]> =>
    apiClient.get('/admin/audit-logs', { params: { startDate, endDate } }).then(r => r.data),

  getGlobalContent: (): Promise<GlobalContent[]> =>
    apiClient.get('/admin/global-content').then(r => r.data),

  createGlobalContent: (data: GlobalContent): Promise<GlobalContent> =>
    apiClient.post('/admin/global-content', data).then(r => r.data),

  updateGlobalContent: (id: number, data: GlobalContent): Promise<GlobalContent> =>
    apiClient.put(`/admin/global-content/${id}`, data).then(r => r.data),
};
