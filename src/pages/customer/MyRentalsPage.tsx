import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Plus, Eye, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockRentals } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

export default function MyRentalsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const myRentals = mockRentals.filter(r => r.customerId === user?.id);

  const filtered = tab === 'all' ? myRentals : myRentals.filter(r => r.status === tab);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    active: { label: 'Đang thuê', cls: 'badge-green' },
    pending: { label: 'Chờ xác nhận', cls: 'badge-yellow' },
    completed: { label: 'Đã hoàn thành', cls: 'badge-gray' },
    cancelled: { label: 'Đã hủy', cls: 'badge-red' },
  };

  const paymentConfig: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Đã thanh toán', cls: 'badge-green' },
    unpaid: { label: 'Chưa thanh toán', cls: 'badge-red' },
    refunded: { label: 'Đã hoàn tiền', cls: 'badge-blue' },
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: myRentals.length },
    { key: 'active', label: 'Đang thuê', count: myRentals.filter(r => r.status === 'active').length },
    { key: 'pending', label: 'Chờ xác nhận', count: myRentals.filter(r => r.status === 'pending').length },
    { key: 'completed', label: 'Đã hoàn thành', count: myRentals.filter(r => r.status === 'completed').length },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Vườn đang thuê">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý thuê vườn</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tất cả vườn bạn đang và đã thuê</p>
        </div>
        <Link to="/gardens" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Thuê thêm vườn
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={clsx('flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', tab === t.key ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn thuê nào</h3>
          <p className="text-gray-500 text-sm mb-6">Hãy khám phá và thuê vườn canh tác ngay!</p>
          <Link to="/gardens" className="btn-primary inline-flex">Khám phá vườn</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rental => (
            <div key={rental.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                <img src={rental.gardenImage} alt={rental.gardenName} className="w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{rental.gardenName}</h3>
                      <div className="text-sm text-gray-500 mt-0.5">{rental.startDate} — {rental.endDate}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={statusConfig[rental.status].cls}>{statusConfig[rental.status].label}</span>
                      <span className={paymentConfig[rental.paymentStatus].cls}>{paymentConfig[rental.paymentStatus].label}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-green-600">{rental.totalPrice.toLocaleString('vi-VN')}đ</span>
                    {rental.iotEnabled && <span className="badge-blue flex items-center gap-1"><Wifi className="w-3 h-3" />IoT</span>}
                    {rental.careServiceRequested && <span className="badge-green flex items-center gap-1"><Wrench className="w-3 h-3" />Chăm sóc</span>}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {rental.iotEnabled && rental.status === 'active' && (
                    <Link to="/dashboard/customer/monitoring" className="btn-outline-green text-xs flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> Giám sát
                    </Link>
                  )}
                  <button className="btn-secondary text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Chi tiết
                  </button>
                  {rental.status === 'active' && (
                    <button className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Hủy
                    </button>
                  )}
                  {rental.paymentStatus === 'unpaid' && (
                    <button className="btn-primary text-xs">Thanh toán</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
