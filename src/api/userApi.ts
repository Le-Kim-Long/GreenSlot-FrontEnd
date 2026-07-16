import apiClient from './axiosConfig';

export interface UserProfileUpdateDTO {
  fullName: string;
  phone: string;
  address: string;
}

export const userApi = {
  updateProfile: (data: UserProfileUpdateDTO) =>
    apiClient.patch('/users/profile', data).then(r => r.data),
};
