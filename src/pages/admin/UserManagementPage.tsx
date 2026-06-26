import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Shield, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { adminApi } from '../../api/adminApi';
import type { UserAdmin } from '../../types/api';
import { roleLabel } from '../../utils/roleMap';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <Shield className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <Shield className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <Shield className="w-full h-full" /> },
];

const ALL_ROLES = [
  'ROLE_CUSTOMER',
  'ROLE_GARDEN_STAFF',
  'ROLE_LOCATION_MANAGER',
  'ROLE_MANAGER',
  'ROLE_ADMIN',
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchUsers = (p = page) => {
    setLoading(true);
    adminApi.getUsers(p, 20)
      .then(res => {
        setUsers(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch(() => setError('Không thể tải danh sách người dùng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const openEditRoles = (user: UserAdmin) => {
    setEditingUser(user);
    setSelectedRoles(user.roles ?? []);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const saveRoles = async () => {
    if (!editingUser || selectedRoles.length === 0) return;
    setSaving(true);
    try {
      await adminApi.updateUserAuthorities(editingUser.id, selectedRoles);
      setEditingUser(null);
      fetchUsers(page);
    } catch {
      setError('Cập nhật vai trò thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: UserAdmin) => {
    try {
      await adminApi.updateUserStatus(user.id, !user.enabled);
      fetchUsers(page);
    } catch {
      setError('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Quản lý người dùng">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Người dùng hệ thống</h2>
        <p className="text-gray-500 text-sm">{totalElements} tài khoản</p>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Tìm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{u.fullName || u.username}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map(r => (
                        <span key={r} className="badge-blue text-xs">{roleLabel(r)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.enabled ? 'badge-green' : 'badge-red'}>{u.enabled ? 'Hoạt động' : 'Khóa'}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditRoles(u)} className="text-xs text-green-600 hover:underline">Vai trò</button>
                    <button onClick={() => toggleStatus(u)} className="text-xs text-red-600 hover:underline">
                      {u.enabled ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Trang {page + 1} / {Math.max(totalPages, 1)}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1 border rounded disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1 border rounded disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Vai trò: {editingUser.fullName}</h3>
            <div className="space-y-2 mb-4">
              {ALL_ROLES.map(role => (
                <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggleRole(role)} />
                  {roleLabel(role)}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveRoles} disabled={saving} className="btn-primary flex-1">Lưu</button>
              <button onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
