import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, Bell, CheckCircle, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },

];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.getHistory()
      .then(setRentals)
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, []);

  const activeRentals = rentals.filter(r => r.status === 'ACTIVE');
  const pendingRentals = rentals.filter(r => r.status === 'PENDING');

  const stats = [
    { label: 'Vườn đang thuê', value: activeRentals.length, icon: <Leaf className="w-6 h-6" />, bg: 'bg-green-50 text-green-600' },
    { label: 'Chờ thanh toán', value: pendingRentals.length, icon: <Clock className="w-6 h-6" />, bg: 'bg-yellow-50 text-yellow-600' },
    { label: 'Tổng đơn thuê', value: rentals.length, icon: <TrendingUp className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Đơn hoàn thành', value: rentals.filter(r => r.status === 'COMPLETED').length, icon: <CheckCircle className="w-6 h-6" />, bg: 'bg-purple-50 text-purple-600' },
  ];

  const statusCls: Record<string, string> = {
    ACTIVE: 'badge-green',
    PENDING: 'badge-yellow',
    COMPLETED: 'badge-gray',
    CANCELLED: 'badge-red',
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Đang thuê',
    PENDING: 'Chờ thanh toán',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Khách hàng">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}!</h2>
        <p className="text-green-100 text-sm">
          {activeRentals.length > 0
            ? `Bạn đang thuê ${activeRentals.length} ô vườn.`
            : 'Khám phá và thuê ô vườn để bắt đầu canh tác.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>{s.icon}</div>
            <div className="text-3xl font-black text-gray-900 mb-1">{loading ? '—' : s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Vườn đang thuê</h3>
          <Link to="/dashboard/customer/rentals" className="text-sm text-green-600 flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" /></div>
        ) : activeRentals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Bạn chưa thuê vườn nào</p>
            <Link to="/gardens" className="text-green-600 text-sm font-medium mt-2 block">Khám phá vườn →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRentals.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{r.slotNumber}</div>
                  <div className="text-xs text-gray-500">{r.locationName} · {r.startDate} — {r.endDate}</div>
                  <span className={clsx('text-xs mt-1 inline-block', statusCls[r.status] || 'badge-gray')}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </div>
                <Link to="/dashboard/customer/monitoring" className="text-green-600"><Wifi className="w-5 h-5" /></Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRentals.length > 0 && (
        <div className="card mt-6 border-yellow-200 bg-yellow-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900">Bạn có {pendingRentals.length} đơn chờ thanh toán</div>
              <Link to="/dashboard/customer/rentals" className="text-sm text-green-600">Xem chi tiết →</Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
