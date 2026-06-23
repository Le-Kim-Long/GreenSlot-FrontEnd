import apiClient from './axiosConfig';

export const managerApi = {
  // Locations
  getLocations: () => apiClient.get('/manager/locations').then(r => r.data),
  getLocation: (id: number) => apiClient.get(`/manager/locations/${id}`).then(r => r.data),
  createLocation: (data: any) => apiClient.post('/manager/locations', data).then(r => r.data),
  updateLocation: (id: number, data: any) => apiClient.put(`/manager/locations/${id}`, data).then(r => r.data),

  // Pillars
  getPillars: () => apiClient.get('/manager/pillars').then(r => r.data),
  getPillar: (id: number) => apiClient.get(`/manager/pillars/${id}`).then(r => r.data),
  createPillar: (data: any) => apiClient.post('/manager/pillars', data).then(r => r.data),
  updatePillar: (id: number, data: any) => apiClient.put(`/manager/pillars/${id}`, data).then(r => r.data),

  // Slots
  getSlots: () => apiClient.get('/manager/slots').then(r => r.data),
  getSlot: (id: number) => apiClient.get(`/manager/slots/${id}`).then(r => r.data),
  createSlot: (data: any) => apiClient.post('/manager/slots', data).then(r => r.data),
  updateSlot: (id: number, data: any) => apiClient.put(`/manager/slots/${id}`, data).then(r => r.data),

  // Service Categories
  getServiceCategories: () => apiClient.get('/manager/service-categories').then(r => r.data),
  getServiceCategory: (id: number) => apiClient.get(`/manager/service-categories/${id}`).then(r => r.data),
  createServiceCategory: (data: any) => apiClient.post('/manager/service-categories', data).then(r => r.data),
  updateServiceCategory: (id: number, data: any) => apiClient.put(`/manager/service-categories/${id}`, data).then(r => r.data),

  // Service Types
  getServiceTypes: () => apiClient.get('/manager/service-types').then(r => r.data),
  getServiceType: (id: number) => apiClient.get(`/manager/service-types/${id}`).then(r => r.data),
  createServiceType: (data: any) => apiClient.post('/manager/service-types', data).then(r => r.data),
  updateServiceType: (id: number, data: any) => apiClient.put(`/manager/service-types/${id}`, data).then(r => r.data),

  // Active Rentals
  getActiveRentals: () => apiClient.get('/manager/active-rentals').then(r => r.data),

  // Revenue Analytics
  getRevenue: (startDate: string, endDate: string) =>
    apiClient.get(`/manager/analytics/revenue?startDate=${startDate}&endDate=${endDate}`).then(r => r.data),
};
