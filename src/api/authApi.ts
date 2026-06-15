import apiClient from './axiosConfig';

export const authApi = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  forgotPassword: async (data: any) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data: any) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  }
};
