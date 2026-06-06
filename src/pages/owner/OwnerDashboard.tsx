import { Link } from 'react-router-dom';
import { Leaf, Calendar, TrendingUp, Settings, DollarSign, Users, Star, ArrowRight, Eye, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockGardens, mockRentals } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/owner', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn của tôi', path: '/dashboard/owner/gardens', icon: <Leaf className="w-full h-full" /> },
  { label: 'Quản lý thuê', path: '/dashboard/owner/rentals', icon: <Calendar className="w-full h-full" /> },
  { label: 'Doanh thu', path: '/dashboard/owner/revenue', icon: <DollarSign className="w-full h-full" /> },
  { label: 'Cài đặt', path: '/dashboard/owner/settings', icon: <Settings className="w-full h-full" /> },
];

export default function OwnerDashboard() {
  const { user } = useAuth();
  const myGardens = mockGardens.filter(g => g.ownerId === user?.id);
  const gardenIds = myGardens.map(g => g.id);
  const myRentals = mockRentals.filter(r => gardenIds.includes(r.gardenId));
  const activeRentals = myRentals.filter(r => r.status === 'active');
  const totalRevenue = myRentals.filter(r => r.paymentStatus === 'paid').reduce((s, r) => s + r.totalPrice, 0);

  const revenueData = [
    { month: 'T7', revenue: 3200000 },
    { month: 'T8', revenue: 4500000 },
    { month: 'T9', revenue: 3800000 },
    { month: 'T10', revenue: 5200000 },
    { month: 'T11', revenue: 4900000 },
    { month: 'T12', revenue: totalRevenue },
  ];

  const stats = [
    { label: 'Tổng vườn', value: myGardens.length, icon: <Leaf className="w-6 h-6" />, bg: 'bg-green-50 text-green-600', sub: `${myGardens.filter(g => g.status === 'available').length} còn trống` },
    { label: 'Đang cho thuê', value: activeRentals.length, icon: <Users className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600', sub: `${myRentals.length} tổng đơn` },
    { label: 'Tổng doanh thu', value: `${(totalRevenue / 1000000).toFixed(1)}tr`, icon: <DollarSign className="w-6 h-6" />, bg: 'bg-emerald-50 text-emerald-600', sub: 'Tháng này' },
    { label: 'Đánh giá TB', value: (myGardens.reduce((s, g) => s + g.rating, 0) / myGardens.length).toFixed(1), icon: <Star className="w-6 h-6" />, bg: 'bg-amber-50 text-amber-600', sub: `${myGardens.reduce((s, g) => s + g.reviewCount, 0)} đánh giá` },
  ];

  const statusConfig: Record<string, { label: string; cls: string }> = {
    available: { label: 'Còn trống', cls: 'badge-green' },
    rented: { label: 'Đã thuê', cls: 'badge-blue' },
    maintenance: { label: 'Bảo trì', cls: 'badge-yellow' },
  };

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Chủ vườn">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}! 🌿</h2>
            <p className="text-emerald-100 text-sm">Bạn có {activeRentals.length} vườn đang được thuê. Doanh thu tháng này rất tốt!</p>
          </div>
          <Link to="/dashboard/owner/gardens/add" className="hidden sm:flex items-center gap-2 bg-white text-green-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors">
            <Plus className="w-4 h-4" /> Thêm vườn mới
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>{s.icon}</div>
            <div className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Doanh thu 6 tháng</h3>
            <Link to="/dashboard/owner/revenue" className="text-sm text-green-600 flex items-center gap-1">
              Chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}tr`} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My gardens */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Vườn của tôi</h3>
            <Link to="/dashboard/owner/gardens" className="text-sm text-green-600 flex items-center gap-1">
              Quản lý <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {myGardens.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                <img src={g.images[0]} alt={g.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{g.name}</div>
                  <div className="text-xs text-gray-500">{g.district}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-600">{g.rating}</span>
                    <span className="text-xs text-gray-400">({g.reviewCount})</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={statusConfig[g.status].cls}>{statusConfig[g.status].label}</span>
                  <span className="text-xs font-medium text-gray-600">{(g.pricePerMonth / 1000000).toFixed(1)}tr/tháng</span>
                </div>
              </div>
            ))}
            <Link to="/dashboard/owner/gardens/add" className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Thêm vườn mới
            </Link>
          </div>
        </div>

        {/* Recent rentals */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Đơn thuê gần đây</h3>
            <Link to="/dashboard/owner/rentals" className="text-sm text-green-600 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Khách hàng</th>
                  <th className="pb-3 font-medium">Vườn</th>
                  <th className="pb-3 font-medium">Thời gian</th>
                  <th className="pb-3 font-medium">Giá trị</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myRentals.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{r.customerName}</td>
                    <td className="py-3 text-gray-600 max-w-[120px] truncate">{r.gardenName}</td>
                    <td className="py-3 text-gray-500 text-xs">{r.startDate}<br />{r.endDate}</td>
                    <td className="py-3 font-semibold text-gray-900">{(r.totalPrice / 1000000).toFixed(1)}tr</td>
                    <td className="py-3">
                      <span className={r.status === 'active' ? 'badge-green' : r.status === 'pending' ? 'badge-yellow' : 'badge-gray'}>
                        {r.status === 'active' ? 'Đang thuê' : r.status === 'pending' ? 'Chờ xác nhận' : 'Xong'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
