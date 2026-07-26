import apiClient from './axiosConfig';

export interface Equipment {
  id: number;
  equipmentName: string;
  serialNumber: string;
  description: string;
  status: string;
  pillarId: number;
  pillarCode?: string;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  imageUrl?: string;
}

export const equipmentApi = {
  getEquipments: (): Promise<Equipment[]> => 
    apiClient.get('/equipment').then(r => r.data),
  
  getEquipment: (id: number): Promise<Equipment> => 
    apiClient.get(`/equipment/${id}`).then(r => r.data),
  
  createEquipment: (data: Partial<Equipment>): Promise<Equipment> => 
    apiClient.post('/equipment', data).then(r => r.data),
  
  updateEquipment: (id: number, data: Partial<Equipment>): Promise<Equipment> => 
    apiClient.put(`/equipment/${id}`, data).then(r => r.data),
  
  deleteEquipment: (id: number): Promise<any> => 
    apiClient.delete(`/equipment/${id}`).then(r => r.data),
};