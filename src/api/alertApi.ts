import apiClient from './axiosConfig';

export interface ProcessAlertPayload {
  alertId?: number; // 👉 Đã đổi thành optional (?) để không cần truyền ID
  status: string;   // 'RESOLVED' | 'PENDING' | 'IGNORED'
  comment: string;
  evidenceImageUrl?: string;
}

// Kết quả thống kê cảnh báo theo khoảng thời gian, dùng cho trang Thống kê Cảnh báo (dashboard)
export interface AlertAnalyticsDTO {
  totalAlerts: number;
  pendingAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySensorType: Record<string, number>;
  averageResolutionTimeMinutes: number;
  mostCommonAlertFrequency: number;
  mostCommonAlertType: string;
}

// 1 cảnh báo IoT cụ thể (sinh ra khi cảm biến vượt ngưỡng), dùng cho danh sách cảnh báo đang chờ xử lý
export interface AlertDTO {
  id: number;
  alertType: string;      // Loại cảnh báo, VD: HIGH_TEMPERATURE, LOW_MOISTURE
  description: string;
  status: string;         // PENDING | IN_PROGRESS | RESOLVED | FAILED | ESCALATED
  thresholdValue: number | null;
  actualValue: number | null;
  sensorType: string;
  pillarId: number | null;
  pillarCode: string | null;
  gardenSlotId: number | null;
  slotNumber: string | null;
  treeId: number | null;
  treeName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const alertApi = {
  // Gửi báo cáo khắc phục sự cố lên hệ thống
  processAlert: async (data: ProcessAlertPayload): Promise<any> => {
    const response = await apiClient.post('/alerts/process', data);
    return response.data;
  },

  // Lấy thống kê cảnh báo theo khoảng thời gian (dùng cho dashboard analytics)
  getAlertAnalytics: async (startDate: string, endDate: string): Promise<AlertAnalyticsDTO> => {
    const response = await apiClient.get('/analytics/alerts', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Lấy danh sách cảnh báo đang chờ xử lý
  getPendingAlerts: async (): Promise<AlertDTO[]> => {
    const response = await apiClient.get('/alerts/pending');
    return response.data;
  },
};