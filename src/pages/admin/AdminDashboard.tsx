import { Link } from 'react-router-dom';
import { Users, Leaf, DollarSign, TrendingUp, Settings, BarChart3, ShieldCheck, ArrowRight, ArrowUp, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { mockUsers, mockGardens, mockRentals, mockCareRequests } from '../../data/mockData';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Vườn canh tác', path: '/dashboard/admin/gardens', icon: <Leaf className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/admin/care', icon: <Settings className="w-full h-full" /> },
  { label: 'Thanh toán', path: '/dashboard/admin/payments', icon: <DollarSign className="w-full h-full" /> },
  { label: 'Báo cáo', path: '/dashboard/admin/reports', icon: <BarChart3 className="w-full h-full" /> },
  { label: 'Hệ thống', path: '/dashboard/admin/system', icon: <ShieldCheck className="w-full h-full" /> },
];

export default function AdminDashboard() {
  const totalRevenue = mockRentals.filter(r => r.paymentStatus === 'paid').reduce((s, r) => s + r.totalPrice, 0);

  const stats = [
    { label: 'Tổng người dùng', value: mockUsers.length, icon: <Users className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600', change: '+12%', up: true },
    { label: 'Tổng vườn', value: mockGardens.length, icon: <Leaf className="w-6 h-6" />, bg: 'bg-green-50 text-green-600', change: '+8%', up: true },
    { label: 'Đơn thuê', value: mockRentals.length, icon: <BarChart3 className="w-6 h-6" />, bg: 'bg-purple-50 text-purple-600', change: '+24%', up: true },
    { label: 'Tổng doanh thu', value: `${(totalRevenue / 1000000).toFixed(1)}tr`, icon: <DollarSign className="w-6 h-6" />, bg: 'bg-emerald-50 text-emerald-600', change: '+18%', up: true },
  ];

  const monthlyRevenue = [
    { month: 'T7', revenue: 15200000, users: 42, rentals: 18 },
    { month: 'T8', revenue: 18500000, users: 58, rentals: 24 },
    { month: 'T9', revenue: 22000000, users: 71, rentals: 31 },
    { month: 'T10', revenue: 19800000, users: 65, rentals: 27 },
    { month: 'T11', revenue: 25600000, users: 89, rentals: 38 },
    { month: 'T12', revenue: totalRevenue + 5000000, users: 112, rentals: 45 },
  ];

  const gardenByDistrict = mockGardens.reduce((acc, g) => {
    acc[g.district] = (acc[g.district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(gardenByDistrict).map(([name, value]) => ({ name, value }));
  const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#0891b2', '#7c3aed'];

  const roleConfig: Record<string, { label: string; cls: string }> = {
    customer: { label: 'Khách hàng', cls: 'badge-blue' },
    owner: { label: 'Chủ vườn', cls: 'badge-green' },
    staff: { label: 'Nhân viên', cls: 'badge-blue' },
    admin: { label: 'Admin', cls: 'badge-red' },
  };

  const recentActivities = [
    { type: 'rental', msg: 'Nguyễn Văn An đặt thuê Vườn Xanh Quận 1', time: '5 phút trước', icon: <Leaf className="w-4 h-4 text-green-500" /> },
    { type: 'payment', msg: 'Thanh toán 4.500.000đ qua VNPay thành công', time: '12 phút trước', icon: <DollarSign className="w-4 h-4 text-blue-500" /> },
    { type: 'register', msg: 'Người dùng mới đăng ký: Hoàng Thị Mai', time: '1 giờ trước', icon: <Users className="w-4 h-4 text-purple-500" /> },
    { type: 'care', msg: 'Lịch chăm sóc #cr2 chờ phân công nhân viên', time: '2 giờ trước', icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { type: 'alert', msg: 'Cảnh báo IoT: Nhiệt độ cao tại Vườn Quận 1', time: '3 giờ trước', icon: <ShieldCheck className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Admin">
      {/* Welcome bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Bảng điều khiển GreenSlot</h2>
            <p className="text-slate-300 text-sm">Hệ thống đang hoạt động bình thường · Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-500 text-white text-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Trực tuyến
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                <ArrowUp className="w-3 h-3" />{s.change}
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Doanh thu 6 tháng gần đây</h3>
            <Link to="/dashboard/admin/reports" className="text-sm text-green-600 flex items-center gap-1">Báo cáo đầy đủ <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Garden distribution */}
        <div className="card">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Vườn theo quận</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-semibold">{d.value} vườn</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users table */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">Người dùng gần đây</h3>
            <Link to="/dashboard/admin/users" className="text-sm text-green-600 flex items-center gap-1">Xem tất cả <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Tên</th>
                  <th className="pb-3 font-medium">Vai trò</th>
                  <th className="pb-3 font-medium">Ngày tham gia</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-bold text-xs">{u.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><span className={roleConfig[u.role]?.cls || 'badge-gray'}>{roleConfig[u.role]?.label}</span></td>
                    <td className="py-3 text-gray-500 text-xs">{u.createdAt}</td>
                    <td className="py-3">
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed + Care requests */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">{a.icon}</div>
                  <div>
                    <div className="text-sm text-gray-900">{a.msg}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending care requests */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Yêu cầu chờ phân công</h3>
              <span className="badge-red">{mockCareRequests.filter(r => r.status === 'pending').length}</span>
            </div>
            <div className="space-y-2">
              {mockCareRequests.filter(r => r.status === 'pending').map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{r.serviceName}</div>
                    <div className="text-xs text-gray-500">{r.gardenName} · {r.scheduledDate}</div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" /></button>
                    <button className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><XCircle className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
