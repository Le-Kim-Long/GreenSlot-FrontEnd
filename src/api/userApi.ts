import apiClient from './axiosConfig';

export interface UserAdminDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  enabled: boolean;
  roles: string[];
}

export interface PageUserAdminDTO {
  content: UserAdminDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserProfileUpdateDTO {
  fullName: string;
  phone: string;
  address: string;
}

export const userApi = {
  getUsers: (page = 0, size = 20) =>
    apiClient.get<PageUserAdminDTO>(`/admin/users`, { params: { page, size } }).then(r => r.data),

  updateUserStatus: (id: number, enabled: boolean) =>
    apiClient.put<UserAdminDTO>(`/admin/users/${id}/status`, { enabled }).then(r => r.data),

  updateUserRoles: (id: number, roles: string[]) =>
    apiClient.put<UserAdminDTO>(`/admin/users/${id}/authorities`, { roles }).then(r => r.data),

  updateProfile: (data: UserProfileUpdateDTO) =>
    apiClient.put('/users/profile', data).then(r => r.data),
};
