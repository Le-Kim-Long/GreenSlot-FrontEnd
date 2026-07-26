import apiClient from './axiosConfig';

export interface ProcessAlertPayload {
  alertId?: number; // 👉 Đã đổi thành optional (?) để không cần truyền ID
  status: string;   // 'RESOLVED' | 'PENDING' | 'IGNORED'
  comment: string;
  evidenceImageUrl?: string;
}

export const alertApi = {
  // Gửi báo cáo khắc phục sự cố lên hệ thống
  processAlert: async (data: ProcessAlertPayload): Promise<any> => {
    const response = await apiClient.post('/alerts/process', data);
    return response.data;
  },
};