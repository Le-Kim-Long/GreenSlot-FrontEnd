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

// Interface cho response trả về từ API Upload ảnh theo Swagger
export interface EquipmentImageUploadResponse {
  id?: number;
  fileName?: string;
  publicUrl: string;
  contentType?: string;
  fileSize?: number;
  message?: string;
  uploadType?: string;
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

  // 👉 HÀM MỚI: Upload ảnh trực tiếp qua Backend API (theo Swagger)
  // Lưu ý: Đổi string URL '/equipment/upload-image' bên dưới cho đúng chính xác với path trên Swagger của bạn nếu cần
  uploadImage: (file: File): Promise<EquipmentImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/equipment/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },
};