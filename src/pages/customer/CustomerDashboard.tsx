import { Link } from 'react-router-dom';
import { Leaf, Calendar, Wifi, Wrench, CreditCard, TrendingUp, Bell, ArrowRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockRentals, mockCareRequests, mockNotifications, mockIoTAlerts } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const myRentals = mockRentals.filter(r => r.customerId === user?.id);
  const activeRentals = myRentals.filter(r => r.status === 'active');
  const myCareRequests = mockCareRequests.filter(r => r.customerId === user?.id);
  const pendingCare = myCareRequests.filter(r => r.status === 'pending' || r.status === 'assigned');
  const myNotifs = mockNotifications.filter(n => n.userId === user?.id && !n.read);
  const activeAlerts = mockIoTAlerts.filter(a => !a.resolved && activeRentals.some(r => r.gardenId === a.gardenId));

  const stats = [
    { label: 'Vườn đang thuê', value: activeRentals.length, icon: <Leaf className="w-6 h-6" />, color: 'bg-green-500', bg: 'bg-green-50 text-green-600' },
    { label: 'Lịch chăm sóc chờ', value: pendingCare.length, icon: <Wrench className="w-6 h-6" />, color: 'bg-blue-500', bg: 'bg-blue-50 text-blue-600' },
    { label: 'Cảnh báo IoT', value: activeAlerts.length, icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-orange-500', bg: 'bg-orange-50 text-orange-600' },
    { label: 'Thông báo chưa đọc', value: myNotifs.length, icon: <Bell className="w-6 h-6" />, color: 'bg-purple-500', bg: 'bg-purple-50 text-purple-600' },
  ];

  const statusCls: Record<string, string> = {
    active: 'badge-green',
    pending: 'badge-yellow',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };

  const statusLabel: Record<string, string> = {
    active: 'Đang thuê',
    pending: 'Chờ xác nhận',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
  };

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Khách hàng">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}! 👋</h2>
            <p className="text-green-100 text-sm">Vườn của bạn đang phát triển tốt. Hôm nay có {activeAlerts.length} cảnh báo cần xem xét.</p>
          </div>
          <div className="hidden sm:block w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
            <Leaf className="w-10 h-10 text-white/80" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>{s.icon}</div>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active rentals */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Vườn đang thuê</h3>
            <Link to="/dashboard/customer/rentals" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {activeRentals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Bạn chưa thuê vườn nào</p>
              <Link to="/gardens" className="text-green-600 text-sm font-medium mt-2 block">Khám phá vườn →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRentals.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                  <img src={r.gardenImage} alt={r.gardenName} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{r.gardenName}</div>
                    <div className="text-xs text-gray-500">{r.startDate} — {r.endDate}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={statusCls[r.status]}>{statusLabel[r.status]}</span>
                      {r.iotEnabled && <span className="badge-blue">IoT</span>}
                    </div>
                  </div>
                  <Link to="/dashboard/customer/monitoring" className="text-green-600 flex-shrink-0">
                    <Wifi className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IoT Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Cảnh báo IoT</h3>
            <Link to="/dashboard/customer/monitoring" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Giám sát <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p className="text-sm">Không có cảnh báo nào</p>
              <p className="text-xs mt-1">Vườn của bạn đang ổn!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map(a => (
                <div key={a.id} className={clsx('flex items-start gap-3 p-3 rounded-xl', a.severity === 'high' ? 'bg-red-50' : a.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50')}>
                  <AlertTriangle className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', a.severity === 'high' ? 'text-red-500' : a.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500')} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{a.message}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(a.timestamp).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Care requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Lịch chăm sóc sắp tới</h3>
            <Link to="/dashboard/customer/care" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingCare.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có lịch chăm sóc</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCare.map(cr => (
                <div key={cr.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{cr.serviceName}</div>
                    <div className="text-xs text-gray-500">{cr.gardenName} · {cr.scheduledDate} {cr.scheduledTime}</div>
                  </div>
                  <span className={cr.status === 'assigned' ? 'badge-blue' : 'badge-yellow'}>
                    {cr.status === 'assigned' ? 'Đã phân công' : 'Chờ xác nhận'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Thông báo mới</h3>
            <Link to="/dashboard/customer/notifications" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockNotifications.filter(n => n.userId === user?.id).slice(0, 4).map(n => (
              <div key={n.id} className={clsx('flex items-start gap-3 p-3 rounded-xl cursor-pointer', !n.read ? 'bg-green-50' : 'hover:bg-gray-50')}>
                <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', !n.read ? 'bg-green-500' : 'bg-gray-300')} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{n.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
