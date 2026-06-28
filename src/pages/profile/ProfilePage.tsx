import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Save, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { getDashboardPath } from '../../utils/roleMap';
import type { UserRole } from '../../types';

const customerNav = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <ArrowLeft className="w-full h-full" /> },
];
const staffNav = [
  { label: 'Tổng quan', path: '/dashboard/staff', icon: <ArrowLeft className="w-full h-full" /> },
];
const gardenStaffNav = [
  { label: 'Tổng quan', path: '/dashboard/garden-staff', icon: <ArrowLeft className="w-full h-full" /> },
];
const adminNav = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <ArrowLeft className="w-full h-full" /> },
];

function getNavForRole(role?: UserRole) {
  switch (role) {
    case 'manager':
    case 'location_manager':
      return staffNav;
    case 'garden_staff':
      return gardenStaffNav;
    case 'admin':
      return adminNav;
    default:
      return customerNav;
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Số điện thoại phải có ít nhất 10 ký tự.');
      return;
    }
    if (!address.trim()) {
      setError('Địa chỉ không được để trống.');
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      updateUser({ name: fullName.trim(), phone: phone.trim(), address: address.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const dashboardPath = user ? getDashboardPath(user.role) : '/';

  return (
    <DashboardLayout navItems={getNavForRole(user?.role)} title="Thông tin cá nhân">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(dashboardPath)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
            <p className="text-gray-500 text-sm mt-0.5">Cập nhật họ tên, số điện thoại và địa chỉ</p>
          </div>
        </div>

        {/* Avatar & basic info */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 font-bold text-2xl">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Chỉnh sửa thông tin</h3>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Cập nhật thông tin thành công!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> Họ và tên</span>
              </label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> Số điện thoại</span>
              </label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                maxLength={15}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Địa chỉ</span>
              </label>
              <input
                type="text"
                className="input"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu thay đổi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
