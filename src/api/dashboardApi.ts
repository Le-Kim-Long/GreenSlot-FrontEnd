import apiClient from './axiosConfig';

export const dashboardApi = {
  getPublicData: async () => {
    const response = await apiClient.get('/dashboard/public');
    return response.data;
  },
  getCustomerData: async () => {
    const response = await apiClient.get('/dashboard/customer');
    return response.data;
  },
  getStaffData: async () => {
    const response = await apiClient.get('/dashboard/staff');
    return response.data;
  }
};
