import apiClient from './axiosConfig';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Tên sự kiện phát ra mỗi khi danh sách thông báo có thể đã thay đổi (vd: vừa đánh dấu đã đọc),
// để chuông thông báo ở DashboardLayout tự fetch lại số chưa đọc mà không cần prop-drilling.
export const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

export const notificationApi = {
  getNotifications: (): Promise<NotificationItem[]> =>
    apiClient.get('/notifications').then(r => r.data),

  markAsRead: (id: number): Promise<NotificationItem> =>
    apiClient.put(`/notifications/${id}/read`).then(r => {
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
      return r.data;
    }),
};
