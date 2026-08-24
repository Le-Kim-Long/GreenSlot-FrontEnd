import apiClient from './axiosConfig';

export interface TreePlantingRequest {
  id: number;
  rentalId: number;
  slotNumber: string;
  locationId?: number;
  locationName?: string;
  newTreeId: number;
  newTreeName: string;
  requestedById: number;
  requestedByName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
  processedById?: number;
  processedByName?: string;
  amount?: number;
  paymentUrl?: string;
  targetPillarId?: number;
  targetPillarCode?: string;
}

// 👉 Interface cho request body gửi lên khi tạo mới (Theo đúng Swagger POST)
export interface CreateTreePlantingPayload {
  rentalId: number;
  newTreeId: number;
  reason: string;
  notes?: string;
  isMobile?: boolean;
  targetPillarId?: number;
  redirectUrl?: string;
}


export const treePlantingApi = {
  // 1. Dành cho Quản lý (Admin/Manager)
  getAllRequests: (): Promise<TreePlantingRequest[]> => 
    apiClient.get('/tree-planting').then(r => r.data),
  
  getRequestById: (id: number): Promise<TreePlantingRequest> => 
    apiClient.get(`/tree-planting/${id}`).then(r => r.data),
  
  updateRequest: (id: number, data: Partial<TreePlantingRequest>): Promise<TreePlantingRequest> =>
    apiClient.put(`/tree-planting/${id}`, data).then(r => r.data),

  deleteRequest: (id: number): Promise<any> =>
    apiClient.delete(`/tree-planting/${id}`).then(r => r.data),

  // Phê duyệt / Từ chối yêu cầu (Location Manager / Manager) — đây mới là endpoint thật sự cập nhật trạng thái
  approveRequest: (id: number): Promise<TreePlantingRequest> =>
    apiClient.post(`/tree-planting/${id}/approve`).then(r => r.data),

  rejectRequest: (id: number, reason?: string): Promise<TreePlantingRequest> =>
    apiClient.post(`/tree-planting/${id}/reject`, reason ?? '').then(r => r.data),

  // 2. 💥 DÀNH CHO KHÁCH HÀNG (Customer Endpoints)
  // Lấy danh sách yêu cầu của chính khách hàng đang đăng nhập
  getMyRequests: (): Promise<TreePlantingRequest[]> => 
    apiClient.get('/tree-planting/my-requests').then(r => r.data),

  // Khách hàng gửi yêu cầu trồng cây mới
  createRequest: (data: CreateTreePlantingPayload): Promise<TreePlantingRequest> => 
    apiClient.post('/tree-planting', data).then(r => r.data),
};