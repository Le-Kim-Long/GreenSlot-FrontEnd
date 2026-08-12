import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Shield, Loader2, MapPin, ShieldCheck, BadgeDollarSign } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { adminApi } from '../../api/adminApi';
import type { UserAdmin } from '../../types/api';
import { roleLabel } from '../../utils/roleMap';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <Shield className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <Shield className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <Shield className="w-full h-full" /> },
  { label: 'Camera IoT', path: '/dashboard/admin/cameras', icon: <ShieldCheck className="w-full h-full" /> },
  { label: 'Giá trị khách hàng', path: '/dashboard/admin/customer-value', icon: <BadgeDollarSign className="w-full h-full" /> },
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

  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    roles: [] as string[],
    locationId: null as number | null
  });

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

  useEffect(() => {
    import('../../api/axiosConfig').then((m) => {
      m.default.get('/locations').then(res => setLocations(res.data)).catch(console.error);
    });
  }, []);

  useEffect(() => { fetchUsers(page); }, [page]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const openEditRoles = (user: UserAdmin) => {
    setEditingUser(user);
    setSelectedRoles(user.roles ?? []);
    setSelectedLocationId(user.locationId ?? null);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const saveRolesAndLocation = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      if (selectedRoles.length > 0) {
        await adminApi.updateUserAuthorities(editingUser.id, selectedRoles);
      }
      
      if (selectedLocationId !== undefined) {
         await adminApi.updateUserLocation(editingUser.id, selectedLocationId || 0);
      }
      setEditingUser(null);
      fetchUsers(page);
    } catch {
      setError('Cập nhật thất bại');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        username: '', email: '', password: '', fullName: '', phone: '', roles: [], locationId: null
      });
      fetchUsers(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo người dùng thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Quản lý người dùng">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Người dùng hệ thống</h2>
          <p className="text-gray-500 text-sm">{totalElements} tài khoản</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Thêm người dùng
        </button>
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
                <th className="px-4 py-3">Cơ sở (Location)</th>
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
                    {u.locationName ? (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-green-600" />
                        {u.locationName}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Không có</span>
                    )}
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
                    <button onClick={() => openEditRoles(u)} className="text-xs text-green-600 hover:underline">Chỉnh sửa</button>
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
            <h3 className="font-bold text-lg mb-4">Phân quyền: {editingUser.fullName}</h3>
            
            <div className="mb-4">
               <label className="block text-sm font-semibold mb-2">Vai trò</label>
               <div className="space-y-2">
                 {ALL_ROLES.map(role => (
                   <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                     <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggleRole(role)} />
                     {roleLabel(role)}
                   </label>
                 ))}
               </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Cơ sở hoạt động (Location)</label>
              <select 
                className="input w-full"
                value={selectedLocationId || ''}
                onChange={e => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Không phân công (All) --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Chỉ định vị trí nếu người dùng là Location Manager hoặc Garden Staff.</p>
            </div>

            <div className="flex gap-2">
              <button onClick={saveRolesAndLocation} disabled={saving} className="btn-primary flex-1">Lưu</button>
              <button onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Thêm người dùng mới</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                  <input required className="input w-full" value={createForm.username} onChange={e => setCreateForm(prev => ({...prev, username: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                  <input type="password" required minLength={6} className="input w-full" value={createForm.password} onChange={e => setCreateForm(prev => ({...prev, password: e.target.value}))} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" required className="input w-full" value={createForm.email} onChange={e => setCreateForm(prev => ({...prev, email: e.target.value}))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Họ tên</label>
                  <input className="input w-full" value={createForm.fullName} onChange={e => setCreateForm(prev => ({...prev, fullName: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                  <input className="input w-full" value={createForm.phone} onChange={e => setCreateForm(prev => ({...prev, phone: e.target.value}))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Vai trò <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={createForm.roles.includes(role)} 
                        onChange={() => {
                          setCreateForm(prev => ({
                            ...prev, 
                            roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
                          }));
                        }} 
                      />
                      {roleLabel(role)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Cơ sở hoạt động (Location)</label>
                <select 
                  className="input w-full"
                  value={createForm.locationId || ''}
                  onChange={e => setCreateForm(prev => ({...prev, locationId: e.target.value ? Number(e.target.value) : null}))}
                >
                  <option value="">-- Không phân công (All) --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Chỉ định vị trí nếu người dùng là Location Manager hoặc Garden Staff.</p>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" disabled={saving || createForm.roles.length === 0} className="btn-primary flex-1">Tạo tài khoản</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}