import apiClient from './axiosConfig';

export interface LocationDTO {
  id: number;
  name: string;
  address: string;
  contactPhone?: string;
  status?: string;
  area?: number;
  imageUrl?: string;
}

export const locationApi = {
  getLocations: (): Promise<LocationDTO[]> => apiClient.get('/locations').then(r => r.data),
  getLocationById: (id: number): Promise<LocationDTO> => apiClient.get(`/locations/${id}`).then(r => r.data),
};
