import { useState } from 'react';
import { Users, Leaf, DollarSign, TrendingUp, Settings, BarChart3, ShieldCheck, Search, Eye, Edit, Trash2, UserPlus, X, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { mockUsers } from '../../data/mockData';
import type { UserRole } from '../../types';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Vườn canh tác', path: '/dashboard/admin/gardens', icon: <Leaf className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/admin/care', icon: <Settings className="w-full h-full" /> },
  { label: 'Thanh toán', path: '/dashboard/admin/payments', icon: <DollarSign className="w-full h-full" /> },
  { label: 'Báo cáo', path: '/dashboard/admin/reports', icon: <BarChart3 className="w-full h-full" /> },
  { label: 'Hệ thống', path: '/dashboard/admin/system', icon: <ShieldCheck className="w-full h-full" /> },
];

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const roleConfig: Record<UserRole, { label: string; cls: string }> = {
    customer: { label: 'Khách hàng', cls: 'badge-blue' },
    owner: { label: 'Chủ vườn', cls: 'badge-green' },
    staff: { label: 'Nhân viên', cls: 'badge-gray' },
    admin: { label: 'Admin', cls: 'badge-red' },
  };

  const filtered = mockUsers.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const roleCounts = mockUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <DashboardLayout navItems={navItems} title="Quản lý người dùng">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Người dùng hệ thống</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý tất cả tài khoản trên nền tảng GreenSlot</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" /> Thêm người dùng
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(['customer', 'owner', 'staff', 'admin'] as UserRole[]).map(role => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={clsx('card p-4 text-left transition-all hover:shadow-md', roleFilter === role ? 'ring-2 ring-green-500' : '')}>
            <div className="text-2xl font-black text-gray-900">{roleCounts[role] || 0}</div>
            <span className={clsx('text-xs mt-1', roleConfig[role].cls)}>{roleConfig[role].label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Tìm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[160px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="owner">Chủ vườn</option>
          <option value="staff">Nhân viên</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Điện thoại</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Ngày tham gia</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-bold text-sm">{u.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={roleConfig[u.role].cls}>{roleConfig[u.role].label}</span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-600">{u.phone || '—'}</td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-500">{u.createdAt}</td>
                  <td className="px-4 py-4">
                    <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Hoạt động</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      {u.role !== 'admin' && (
                        <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {filtered.length} / {mockUsers.length} người dùng</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40" disabled>‹</button>
            <button className="px-3 py-1 rounded-lg bg-green-600 text-white">1</button>
            <button className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">›</button>
          </div>
        </div>
      </div>

      {/* Add user modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Thêm người dùng</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Họ tên</label><input className="input" placeholder="Nguyễn Văn A" /></div>
              <div><label className="label">Email</label><input type="email" className="input" placeholder="user@example.com" /></div>
              <div><label className="label">Số điện thoại</label><input type="tel" className="input" placeholder="0901234567" /></div>
              <div>
                <label className="label">Vai trò</label>
                <select className="input">
                  <option value="customer">Khách hàng</option>
                  <option value="owner">Chủ vườn</option>
                  <option value="staff">Nhân viên</option>
                </select>
              </div>
              <div><label className="label">Mật khẩu tạm</label><input type="password" className="input" placeholder="Tối thiểu 8 ký tự" /></div>
              <div className="flex gap-3">
                <button className="btn-primary flex-1">Tạo tài khoản</button>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-4">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
