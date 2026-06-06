import { useState } from 'react';
import { CheckCircle, Clock, MapPin, Phone, TrendingUp, List, User, Star, Calendar, Wrench, X } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockCareRequests, mockCareServices } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/staff', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Nhiệm vụ', path: '/dashboard/staff/tasks', icon: <List className="w-full h-full" /> },
  { label: 'Lịch làm việc', path: '/dashboard/staff/schedule', icon: <Calendar className="w-full h-full" /> },
  { label: 'Hồ sơ', path: '/dashboard/staff/profile', icon: <User className="w-full h-full" /> },
];

const categoryIcons: Record<string, string> = {
  watering: '💧', fertilizing: '🌱', pruning: '✂️',
  pest_control: '🛡️', harvest: '🌾', consultation: '💬',
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const myTasks = mockCareRequests.filter(r => r.staffId === user?.id || r.staffId === 'u3');
  const pendingTasks = mockCareRequests.filter(r => r.status === 'pending');
  const [activeTab, setActiveTab] = useState<'mine' | 'available'>('mine');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const allTasks = activeTab === 'mine' ? myTasks : pendingTasks;

  const stats = [
    { label: 'Nhiệm vụ hôm nay', value: myTasks.filter(t => t.scheduledDate === new Date().toISOString().split('T')[0]).length, icon: <Calendar className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Đang thực hiện', value: myTasks.filter(t => t.status === 'in_progress').length, icon: <Wrench className="w-6 h-6" />, bg: 'bg-orange-50 text-orange-600' },
    { label: 'Hoàn thành tháng này', value: myTasks.filter(t => t.status === 'completed').length, icon: <CheckCircle className="w-6 h-6" />, bg: 'bg-green-50 text-green-600' },
    { label: 'Đánh giá TB', value: '4.8', icon: <Star className="w-6 h-6" />, bg: 'bg-amber-50 text-amber-600' },
  ];

  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ xác nhận', cls: 'badge-yellow' },
    assigned: { label: 'Đã nhận việc', cls: 'badge-blue' },
    in_progress: { label: 'Đang thực hiện', cls: 'badge-green' },
    completed: { label: 'Hoàn thành', cls: 'badge-gray' },
    cancelled: { label: 'Đã hủy', cls: 'badge-red' },
  };

  const task = selectedTask ? mockCareRequests.find(t => t.id === selectedTask) : null;
  const taskService = task ? mockCareServices.find(s => s.id === task.serviceId) : null;

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Nhân viên">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}! 🌿</h2>
        <p className="text-purple-100 text-sm">
          Hôm nay bạn có {myTasks.filter(t => t.scheduledDate === '2024-12-22').length} nhiệm vụ được lên lịch. Chúc làm việc hiệu quả!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>{s.icon}</div>
            <div className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Nhiệm vụ chăm sóc</h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('mine')} className={clsx('px-3 py-1.5 rounded-md text-sm font-medium transition-all', activeTab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
              Của tôi ({myTasks.length})
            </button>
            <button onClick={() => setActiveTab('available')} className={clsx('px-3 py-1.5 rounded-md text-sm font-medium transition-all', activeTab === 'available' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
              Chờ nhận ({pendingTasks.length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {allTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>Không có nhiệm vụ nào</p>
            </div>
          ) : allTasks.map(req => (
            <div key={req.id} onClick={() => setSelectedTask(req.id)}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer hover:border-green-200 transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {categoryIcons[mockCareServices.find(s => s.id === req.serviceId)?.category || 'watering']}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{req.serviceName}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{req.gardenName}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />{req.scheduledDate} lúc {req.scheduledTime}
                </div>
                <div className="text-sm text-gray-600 mt-0.5 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />KH: {req.customerName}</div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <span className={statusConfig[req.status].cls}>{statusConfig[req.status].label}</span>
                <span className="font-bold text-gray-900 text-sm">{req.price.toLocaleString('vi-VN')}đ</span>
                {activeTab === 'available' && req.status === 'pending' && (
                  <button className="btn-primary text-xs py-1.5" onClick={e => { e.stopPropagation(); }}>Nhận việc</button>
                )}
                {req.status === 'assigned' && (
                  <button className="btn-primary text-xs py-1.5 bg-orange-500 hover:bg-orange-600 border-orange-500">Bắt đầu</button>
                )}
                {req.status === 'in_progress' && (
                  <button className="btn-primary text-xs py-1.5">Hoàn thành</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task detail modal */}
      {task && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết nhiệm vụ</h2>
              <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <div className="text-3xl">{categoryIcons[taskService?.category || 'watering']}</div>
                <div>
                  <div className="font-bold text-gray-900">{task.serviceName}</div>
                  <div className="text-sm text-gray-500">{taskService?.description}</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Vườn</span><span className="font-medium">{task.gardenName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Khách hàng</span><span className="font-medium">{task.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Ngày giờ</span><span className="font-medium">{task.scheduledDate} {task.scheduledTime}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Thù lao</span><span className="font-bold text-green-600">{task.price.toLocaleString('vi-VN')}đ</span></div>
                {task.notes && <div className="flex justify-between"><span className="text-gray-500">Ghi chú</span><span className="font-medium">{task.notes}</span></div>}
              </div>
              <div className="flex gap-3 pt-3">
                {task.status === 'assigned' && <button className="btn-primary flex-1 py-2.5">Bắt đầu thực hiện</button>}
                {task.status === 'in_progress' && <button className="btn-primary flex-1 py-2.5">Báo hoàn thành</button>}
                {task.status === 'pending' && <button className="btn-primary flex-1 py-2.5">Nhận nhiệm vụ</button>}
                <button onClick={() => setSelectedTask(null)} className="btn-secondary px-4">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
