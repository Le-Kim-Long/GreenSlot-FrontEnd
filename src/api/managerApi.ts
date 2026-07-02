import apiClient from './axiosConfig';
import type { ServiceCategory, ServiceType } from '../types/api';

function mapServiceCategory(item: any): ServiceCategory {
  return {
    id: item.id,
    name: item.name ?? item.categoryName ?? '',
    categoryName: item.categoryName ?? item.name ?? '',
    description: item.description ?? '',
  };
}

function mapServiceType(item: any): ServiceType {
  return {
    id: item.id,
    name: item.name ?? item.serviceName ?? '',
    serviceName: item.serviceName ?? item.name ?? '',
    description: item.description ?? '',
    price: Number(item.price ?? 0),
    serviceCategoryId: item.serviceCategoryId ?? item.categoryId,
    categoryId: item.categoryId ?? item.serviceCategoryId,
  };
}

export const managerApi = {
  // Locations
  getLocations: () => apiClient.get('/manager/locations').then(r => r.data),
  getLocation: (id: number) => apiClient.get(`/manager/locations/${id}`).then(r => r.data),
  createLocation: (data: any) => apiClient.post('/manager/locations', data).then(r => r.data),
  updateLocation: (id: number, data: any) => apiClient.put(`/manager/locations/${id}`, data).then(r => r.data),
  deleteLocation: (id: number) => apiClient.delete(`/manager/locations/${id}`).then(r => r.data),

  // Pillars
  getPillars: () => apiClient.get('/manager/pillars').then(r => r.data),
  getPillar: (id: number) => apiClient.get(`/manager/pillars/${id}`).then(r => r.data),
  createPillar: (data: any) => apiClient.post('/manager/pillars', data).then(r => r.data),
  updatePillar: (id: number, data: any) => apiClient.put(`/manager/pillars/${id}`, data).then(r => r.data),
  deletePillar: (id: number) => apiClient.delete(`/manager/pillars/${id}`).then(r => r.data),

  // Slots
  getSlots: () => apiClient.get('/manager/slots').then(r => r.data),
  getSlot: (id: number) => apiClient.get(`/manager/slots/${id}`).then(r => r.data),
  createSlot: (data: any) => apiClient.post('/manager/slots', data).then(r => r.data),
  updateSlot: (id: number, data: any) => apiClient.put(`/manager/slots/${id}`, data).then(r => r.data),
  deleteSlot: (id: number) => apiClient.delete(`/manager/slots/${id}`).then(r => r.data),

  // Service Categories
  getServiceCategories: () => apiClient.get('/manager/service-categories').then(r => (r.data || []).map(mapServiceCategory)),
  getServiceCategory: (id: number) => apiClient.get(`/manager/service-categories/${id}`).then(r => mapServiceCategory(r.data)),
  createServiceCategory: (data: { name: string; description?: string }) =>
    apiClient.post('/manager/service-categories', { categoryName: data.name, description: data.description }).then(r => mapServiceCategory(r.data)),
  updateServiceCategory: (id: number, data: { name: string; description?: string }) =>
    apiClient.put(`/manager/service-categories/${id}`, { categoryName: data.name, description: data.description }).then(r => mapServiceCategory(r.data)),

  // Service Types
  getServiceTypes: () => apiClient.get('/manager/service-types').then(r => (r.data || []).map(mapServiceType)),
  getServiceType: (id: number) => apiClient.get(`/manager/service-types/${id}`).then(r => mapServiceType(r.data)),
  createServiceType: (data: { name?: string; serviceName?: string; description?: string; price: number; serviceCategoryId?: number; categoryId?: number }) =>
    apiClient.post('/manager/service-types', {
      serviceName: data.name ?? data.serviceName,
      description: data.description,
      price: data.price,
      categoryId: data.serviceCategoryId ?? data.categoryId,
    }).then(r => mapServiceType(r.data)),
  updateServiceType: (id: number, data: { name?: string; serviceName?: string; description?: string; price: number; serviceCategoryId?: number; categoryId?: number }) =>
    apiClient.put(`/manager/service-types/${id}`, {
      serviceName: data.name ?? data.serviceName,
      description: data.description,
      price: data.price,
      categoryId: data.serviceCategoryId ?? data.categoryId,
    }).then(r => mapServiceType(r.data)),

  // Active Rentals
  getActiveRentals: () => apiClient.get('/manager/active-rentals').then(r => r.data),

  // Revenue Analytics
  getRevenue: (startDate: string, endDate: string) =>
    apiClient.get(`/manager/analytics/revenue?startDate=${startDate}&endDate=${endDate}`).then(r => r.data),
};
