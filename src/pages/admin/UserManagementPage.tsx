import { useState, useEffect } from 'react';
import { Users, Search, Shield, Loader2, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { adminApi } from '../../api/adminApi';
import type { UserAdmin } from '../../types/api';
import { roleLabel, mapBackendRolesToFrontend, type FrontendRole } from '../../utils/roleMap';

const ROLE_ORDER: FrontendRole[] = ['admin', 'manager', 'location_manager', 'garden_staff', 'customer'];

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <Shield className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
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
  const [selectedRole, setSelectedRole] = useState<string>('ROLE_CUSTOMER');
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const isLocationRequiredRole = (role: string | null | undefined) => {
    return role === 'ROLE_LOCATION_MANAGER' || role === 'ROLE_GARDEN_STAFF';
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'ROLE_CUSTOMER',
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

  const filtered = users
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    })
    .slice()
    .sort((a, b) => {
      const roleDiff = ROLE_ORDER.indexOf(mapBackendRolesToFrontend(a.roles)) - ROLE_ORDER.indexOf(mapBackendRolesToFrontend(b.roles));
      if (roleDiff !== 0) return roleDiff;
      return b.id - a.id;
    });

  const openCreateModal = () => {
    setModalError('');
    setCreateForm({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'ROLE_CUSTOMER',
      locationId: null,
    });
    setShowCreateModal(true);
  };

  const openEditRoles = (user: UserAdmin) => {
    setEditingUser(user);
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'ROLE_CUSTOMER';
    setSelectedRole(userRole);
    setSelectedLocationId(isLocationRequiredRole(userRole) ? (user.locationId ?? null) : null);
  };

  const saveRolesAndLocation = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      if (selectedRole) {
        await adminApi.updateUserAuthorities(editingUser.id, [selectedRole]);
      }
      
      const locId = isLocationRequiredRole(selectedRole) ? (selectedLocationId || 0) : 0;
      await adminApi.updateUserLocation(editingUser.id, locId);

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
    setModalError('');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!createForm.username.trim()) {
      setModalError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (/\s/.test(createForm.username.trim())) {
      setModalError('Tên đăng nhập không được chứa khoảng trắng.');
      return;
    }
    if (!createForm.email.trim() || !emailRegex.test(createForm.email.trim())) {
      setModalError('Email không hợp lệ (ví dụ: user@example.com).');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      setModalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (isLocationRequiredRole(createForm.role) && !createForm.locationId) {
      setModalError('Vui lòng chọn cơ sở phụ trách cho vai trò này.');
      return;
    }

    setSaving(true);
    try {
      const locId = isLocationRequiredRole(createForm.role) ? createForm.locationId : null;
      await adminApi.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        fullName: createForm.fullName?.trim(),
        phone: createForm.phone?.trim(),
        roles: [createForm.role],
        locationId: locId,
      });
      setShowCreateModal(false);
      setCreateForm({
        username: '', email: '', password: '', fullName: '', phone: '', role: 'ROLE_CUSTOMER', locationId: null
      });
      fetchUsers(0);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Tạo người dùng thất bại. Vui lòng kiểm tra lại.');
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
        <button onClick={openCreateModal} className="btn-primary">
          + Thêm người dùng
        </button>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Tìm theo tên, email, username..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="px-4 py-3">Thông tin người dùng</th>
                <th className="px-4 py-3">Cơ sở vườn</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {u.fullName || u.username}
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-0.5">
                      {u.fullName && (
                        <span><span className="font-medium text-gray-600">Tài khoản:</span> {u.username}</span>
                      )}
                      <span><span className="font-medium text-gray-600">Email:</span> {u.email}</span>
                    </div>
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
          <div className="px-4 py-3 border-t">
            <Pagination
              currentPage={page + 1}
              totalPages={Math.max(totalPages, 1)}
              totalItems={totalElements}
              pageSize={20}
              onPageChange={(p) => setPage(p - 1)}
              itemName="tài khoản"
            />
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Phân quyền: {editingUser.fullName}</h3>
            
            <div className="mb-4">
               <label className="block text-sm font-semibold mb-2">Vai trò (Chỉ chọn 1 vai trò) <span className="text-red-500">*</span></label>
               <div className="space-y-2">
                 {ALL_ROLES.map(role => (
                   <label key={role} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                     <input 
                       type="radio" 
                       name="editUserRole" 
                       checked={selectedRole === role} 
                       onChange={() => {
                         setSelectedRole(role);
                         if (!isLocationRequiredRole(role)) {
                           setSelectedLocationId(null);
                         }
                       }} 
                       className="text-green-600 focus:ring-green-500"
                     />
                     <span className="font-medium text-gray-800">{roleLabel(role)}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Cơ sở hoạt động (Location)</label>
              <select 
                className={`input w-full ${!isLocationRequiredRole(selectedRole) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                disabled={!isLocationRequiredRole(selectedRole)}
                value={isLocationRequiredRole(selectedRole) ? (selectedLocationId || '') : ''}
                onChange={e => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Chọn cơ sở phụ trách --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <p className="text-xs mt-1.5 leading-relaxed">
                {!isLocationRequiredRole(selectedRole) ? (
                  <span className="text-amber-600 font-medium">🔒 Vai trò <strong>{roleLabel(selectedRole)}</strong> không gán cơ sở cố định (hoạt động toàn hệ thống hoặc là khách hàng).</span>
                ) : (
                  <span className="text-gray-500">Chỉ định vị trí cơ sở làm việc cho Location Manager hoặc Garden Staff.</span>
                )}
              </p>
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
            <h3 className="font-bold text-lg mb-2">Thêm người dùng mới</h3>
            <p className="text-xs text-gray-500 mb-4">Tạo tài khoản mới và thiết lập vai trò trong hệ thống.</p>
            
            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} noValidate className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    autoComplete="off"
                    placeholder="vd: nguyenvana"
                    className="input w-full" 
                    value={createForm.username} 
                    onChange={e => {
                      setCreateForm(prev => ({...prev, username: e.target.value}));
                      if (modalError) setModalError('');
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    required 
                    minLength={6} 
                    autoComplete="new-password"
                    placeholder="Tối thiểu 6 ký tự"
                    className="input w-full" 
                    value={createForm.password} 
                    onChange={e => {
                      setCreateForm(prev => ({...prev, password: e.target.value}));
                      if (modalError) setModalError('');
                    }} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required 
                  autoComplete="off"
                  placeholder="vd: nguyenvana@gmail.com"
                  className="input w-full" 
                  value={createForm.email} 
                  onChange={e => {
                    setCreateForm(prev => ({...prev, email: e.target.value}));
                    if (modalError) setModalError('');
                  }} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Họ tên</label>
                  <input 
                    autoComplete="off"
                    placeholder="vd: Nguyễn Văn A"
                    className="input w-full" 
                    value={createForm.fullName} 
                    onChange={e => setCreateForm(prev => ({...prev, fullName: e.target.value}))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                  <input 
                    autoComplete="off"
                    placeholder="vd: 0912345678"
                    className="input w-full" 
                    value={createForm.phone} 
                    onChange={e => setCreateForm(prev => ({...prev, phone: e.target.value}))} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Vai trò (Chỉ chọn 1 vai trò) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="createUserRole"
                        checked={createForm.role === role} 
                        onChange={() => {
                          setCreateForm(prev => ({
                            ...prev, 
                            role,
                            locationId: isLocationRequiredRole(role) ? prev.locationId : null
                          }));
                          if (modalError) setModalError('');
                        }} 
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium text-gray-800">{roleLabel(role)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Cơ sở hoạt động (Location)</label>
                <select 
                  className={`input w-full ${!isLocationRequiredRole(createForm.role) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  disabled={!isLocationRequiredRole(createForm.role)}
                  value={isLocationRequiredRole(createForm.role) ? (createForm.locationId || '') : ''}
                  onChange={e => {
                    setCreateForm(prev => ({...prev, locationId: e.target.value ? Number(e.target.value) : null}));
                    if (modalError) setModalError('');
                  }}
                >
                  <option value="">-- Chọn cơ sở phụ trách --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1.5 leading-relaxed">
                  {!isLocationRequiredRole(createForm.role) ? (
                    <span className="text-amber-600 font-medium">🔒 Vai trò <strong>{roleLabel(createForm.role)}</strong> không gán cơ sở cố định (hoạt động toàn hệ thống hoặc là khách hàng).</span>
                  ) : (
                    <span className="text-gray-500">Chỉ định vị trí cơ sở làm việc cho Location Manager hoặc Garden Staff.</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" disabled={saving || !createForm.role} className="btn-primary flex-1">Tạo tài khoản</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}