import { useState, useEffect } from 'react';
import { Users, Leaf, DollarSign, TrendingUp, Settings, BarChart3, ShieldCheck, Search, Eye, Edit, Trash2, UserPlus, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { userApi, type UserAdminDTO } from '../../api/userApi';
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

const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  ROLE_ADMIN: 'admin',
  ROLE_MANAGER: 'staff',
  ROLE_FARMER: 'owner',
  ROLE_CUSTOMER: 'customer',
};

function mapBackendRole(roles: string[]): UserRole {
  if (roles.includes('ROLE_ADMIN')) return 'admin';
  if (roles.includes('ROLE_MANAGER')) return 'staff';
  if (roles.includes('ROLE_FARMER')) return 'owner';
  return 'customer';
}

const roleConfig: Record<UserRole, { label: string; cls: string }> = {
  customer: { label: 'Khách hàng', cls: 'badge-blue' },
  owner: { label: 'Chủ vườn', cls: 'badge-green' },
  staff: { label: 'Nhân viên', cls: 'badge-gray' },
  admin: { label: 'Admin', cls: 'badge-red' },
};

const PAGE_SIZE = 20;

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAdminDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const data = await userApi.getUsers(page, PAGE_SIZE);
      setUsers(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const name = u.fullName || u.username || '';
    const email = u.email || '';
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && mapBackendRole(u.roles) !== roleFilter) return false;
    return true;
  });

  const roleCounts = users.reduce((acc, u) => {
    const role = mapBackendRole(u.roles);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={() => fetchUsers(currentPage)} className="ml-2 underline">Thử lại</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Điện thoại</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Đang tải...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const role = mapBackendRole(u.roles);
                  const displayName = u.fullName || u.username;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-700 font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{displayName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={roleConfig[role].cls}>{roleConfig[role].label}</span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-600">{u.phone || '—'}</td>
                      <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-500">{u.address || '—'}</td>
                      <td className="px-4 py-4">
                        {u.enabled ? (
                          <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Hoạt động</span>
                        ) : (
                          <span className="badge-red flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Bị khóa</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors"><Edit className="w-4 h-4" /></button>
                          {role !== 'admin' && (
                            <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {filtered.length} / {totalElements} người dùng</span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              disabled={currentPage === 0}
              onClick={() => fetchUsers(currentPage - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={clsx('px-3 py-1 rounded-lg', i === currentPage ? 'bg-green-600 text-white' : 'border border-gray-200 hover:bg-gray-50')}
                onClick={() => fetchUsers(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchUsers(currentPage + 1)}
            >
              ›
            </button>
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
