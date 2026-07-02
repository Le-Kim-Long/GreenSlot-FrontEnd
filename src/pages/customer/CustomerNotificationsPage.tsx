import { useEffect, useState } from 'react';
import { Bell, Loader2, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { notificationApi } from '../../api/notificationApi';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <Bell className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

export default function CustomerNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      await fetchData();
    } catch {
      setError('Không thể cập nhật thông báo');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Thông báo">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Thông báo của bạn</h2>
        <p className="text-gray-500 text-sm mt-1">Tất cả thông báo từ hệ thống và các hoạt động thuê vườn.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`card ${item.isRead ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{item.message}</div>
                  <div className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                {!item.isRead && (
                  <button onClick={() => handleMarkRead(item.id)} className="btn-outline-green text-xs inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
