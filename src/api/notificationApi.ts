import apiClient from './axiosConfig';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: (): Promise<NotificationItem[]> =>
    apiClient.get('/notifications').then(r => r.data),

  markAsRead: (id: number): Promise<NotificationItem> =>
    apiClient.put(`/notifications/${id}/read`).then(r => r.data),
};
