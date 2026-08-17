import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { notificationApi, NotificationItem } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotificationsData = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;
    if (showLoading) setLoading(true);

    try {
      const [listData, unreadData] = await Promise.allSettled([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);

      if (listData.status === 'fulfilled' && Array.isArray(listData.value)) {
        setNotifications(listData.value);
        // If unread endpoint succeeded use it, otherwise compute from list
        if (unreadData.status === 'fulfilled' && typeof unreadData.value?.unreadCount === 'number') {
          setUnreadCount(unreadData.value.unreadCount);
        } else {
          const calculatedCount = listData.value.filter(item => !item.isRead).length;
          setUnreadCount(calculatedCount);
        }
      } else if (unreadData.status === 'fulfilled' && typeof unreadData.value?.unreadCount === 'number') {
        setUnreadCount(unreadData.value.unreadCount);
      }
    } catch (err) {
      console.warn('Lỗi khi tải thông báo từ máy chủ:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch and 30-second live background polling
  useEffect(() => {
    if (isAuthenticated && user) {
      void fetchNotificationsData(true);

      const intervalId = setInterval(() => {
        void fetchNotificationsData(false);
      }, 30000); // 30s background polling

      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isAuthenticated, user?.email, fetchNotificationsData]);

  // Mark a single notification as read
  const markAsRead = async (id: number) => {
    // 1. Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 2. Call backend
    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.error(`Lỗi đánh dấu đã đọc thông báo #${id}:`, err);
      // Re-sync on failure
      void fetchNotificationsData(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // 1. Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // 2. Call backend
    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
      void fetchNotificationsData(false);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotificationsData(true);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
