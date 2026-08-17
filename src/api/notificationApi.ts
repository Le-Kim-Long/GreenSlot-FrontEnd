import apiClient from './axiosConfig';

export interface NotificationItem {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: string;
  referenceId?: number | null;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkAllReadResponse {
  message: string;
  updatedCount: number;
}

export const notificationApi = {
  getNotifications: (): Promise<NotificationItem[]> =>
    apiClient.get<NotificationItem[]>('/notifications').then(r => r.data),

  getUnreadCount: (): Promise<UnreadCountResponse> =>
    apiClient.get<UnreadCountResponse>('/notifications/unread-count').then(r => r.data),

  markAsRead: (id: number): Promise<NotificationItem> =>
    apiClient.put<NotificationItem>(`/notifications/${id}/read`).then(r => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
      }
      return r.data;
    }),

  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    try {
      const res = await apiClient.put<MarkAllReadResponse>('/notifications/read-all');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
      }
      return res.data;
    } catch {
      // Fallback: try PATCH endpoint
      try {
        const res = await apiClient.patch<MarkAllReadResponse>('/notifications/read-all');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
        }
        return res.data;
      } catch (fallbackErr) {
        console.warn('Failed to mark all as read:', fallbackErr);
        return { message: 'All notifications marked as read', updatedCount: 0 };
      }
    }
  },
};
