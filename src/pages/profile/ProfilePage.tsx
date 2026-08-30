import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Save, Loader2, ArrowLeft, CheckCircle, Camera, Upload } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { userApi, imageApi, UploadedImage } from '../../api/userApi';
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

// 💥 HÀM THẦN THÁNH: Chuyển đổi link GCS (bị Google Cloud khóa) sang link Firebase Web (đọc thoải mái)
const formatFirebaseUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('https://storage.googleapis.com/')) {
    const withoutDomain = url.replace('https://storage.googleapis.com/', '');
    const firstSlashIndex = withoutDomain.indexOf('/');
    if (firstSlashIndex !== -1) {
      const bucket = withoutDomain.substring(0, firstSlashIndex);
      const path = withoutDomain.substring(firstSlashIndex + 1);
      // Biến đổi sang cấu trúc chuẩn của Firebase Storage Web URL
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  return url;
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Quản lý link ảnh đại diện (đã qua chuyển đổi link)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    formatFirebaseUrl(user?.avatar || (user as any)?.publicUrl || (user as any)?.avatarUrl || (user as any)?.imageUrl)
  );

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy ảnh mới nhất từ my-uploads và ép sang link đọc được
  useEffect(() => {
    const fetchLatestAvatar = async () => {
      try {
        const uploads: UploadedImage[] = await imageApi.getMyUploads();
        if (Array.isArray(uploads) && uploads.length > 0) {
          const avatarImages = uploads.filter(
            img => String(img?.uploadType || '').trim().toUpperCase() === 'AVATAR'
          );

          if (avatarImages.length > 0) {
            const latestAvatar = avatarImages.sort((a, b) => (b.id || 0) - (a.id || 0))[0];

            if (latestAvatar?.publicUrl) {
              // 👉 CHUYỂN ĐỔI LINK TRƯỚC KHI HIỂN THỊ
              const readableUrl = formatFirebaseUrl(latestAvatar.publicUrl);
              console.log('✅ Link sau khi đã chuyển đổi để trình duyệt đọc được:', readableUrl);
              
              setAvatarUrl(readableUrl);
              updateUser({
                avatar: readableUrl,
                avatarUrl: readableUrl,
                imageUrl: readableUrl,
              } as any);
            }
          }
        }
      } catch (err) {
        console.error('Không thể tải danh sách ảnh của user:', err);
      }
    };

    fetchLatestAvatar();
  }, []);

  // XỬ LÝ UPLOAD AVATAR THÔNG QUA API POST /api/images/upload/avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chỉ chọn định dạng hình ảnh (JPG, PNG, WEBP...).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa không được vượt quá 5MB.');
      return;
    }

    setError('');
    
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarUrl(localPreviewUrl);
    setUploadingAvatar(true);

    try {
      const serverPublicUrl = await imageApi.uploadAvatar(file);
      
      // 👉 Chuyển đổi link server trả về sang định dạng đọc được
      const finalUrl = (typeof serverPublicUrl === 'string' && serverPublicUrl.startsWith('http')) 
        ? formatFirebaseUrl(serverPublicUrl) 
        : localPreviewUrl;
      
      // Giải phóng Blob URL cũ sau khi đã có URL từ server
      if (finalUrl !== localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      
      setAvatarUrl(finalUrl);
      updateUser({ avatar: finalUrl, avatarUrl: finalUrl, imageUrl: finalUrl } as any);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      
      updateUser({ name: fullName.trim(), phone: phone.trim(), address: address.trim() } as any);
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
            <p className="text-gray-500 text-sm mt-0.5">Cập nhật ảnh đại diện, họ tên, số điện thoại và địa chỉ</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm font-medium">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Cập nhật thông tin thành công!
          </div>
        )}

        {/* Avatar & basic info */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div 
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-green-100 border-2 border-green-500/20 flex items-center justify-center cursor-pointer relative shadow-sm transition-all group-hover:border-green-500"
                title="Bấm để thay đổi ảnh đại diện"
              >
                {uploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                ) : null}

                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      console.error('⚠️ Vẫn lỗi load link ảnh:', avatarUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}

                <span className="text-green-700 font-bold text-3xl absolute inset-0 flex items-center justify-center -z-10 bg-green-100">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>

                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] font-medium z-20">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Sửa ảnh</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md border-2 border-white transition-transform active:scale-95 disabled:opacity-50 z-20"
                title="Gửi ảnh đại diện"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng tối đa: 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} noValidate className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Chỉnh sửa thông tin</h3>

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