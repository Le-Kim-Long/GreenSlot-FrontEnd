import apiClient from './axiosConfig';
import type {
  PageResponse,
  UserAdmin,
} from '../types/api';

export const adminApi = {
  getUsers: (page = 0, size = 20): Promise<PageResponse<UserAdmin>> =>
    apiClient.get('/admin/users', { params: { page, size } }).then(r => r.data),

  createUser: (data: any): Promise<UserAdmin> =>
    apiClient.post('/admin/users', data).then(r => r.data),

  updateUserAuthorities: (id: number, roles: string[]): Promise<UserAdmin> =>
    apiClient.put(`/admin/users/${id}/authorities`, { roles }).then(r => r.data),

  updateUserStatus: (id: number, enabled: boolean): Promise<UserAdmin> =>
    apiClient.put(`/admin/users/${id}/status`, { enabled }).then(r => r.data),

  updateUserLocation: (id: number, locationId: number): Promise<UserAdmin> =>
    apiClient.put(`/admin/users/${id}/location/${locationId}`).then(r => r.data),
};
