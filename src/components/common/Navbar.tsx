import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  Leaf,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getDashboardPath as resolveDashboardPath, roleLabel } from '../../utils/roleMap';
import { formatFirebaseUrl } from '../../utils/firebaseUrl';
import { formatRelativeTime, getNotificationMeta, getNotificationTargetUrl } from '../../utils/notificationHelpers';
import { imageApi, UploadedImage } from '../../api/userApi';
import { NotificationItem } from '../../api/notificationApi';



export default function Navbar() {
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = formatFirebaseUrl(
    user?.avatar || (user as any)?.publicUrl || (user as any)?.avatarUrl || (user as any)?.imageUrl
  );

  // Tự động đồng bộ ảnh avatar khi vừa đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      const syncAvatar = async () => {
        try {
          const uploads: UploadedImage[] = await imageApi.getMyUploads();
          if (Array.isArray(uploads) && uploads.length > 0) {
            const avatarImages = uploads.filter(
              img => String(img?.uploadType || '').trim().toUpperCase() === 'AVATAR'
            );
            if (avatarImages.length > 0) {
              const latestAvatar = avatarImages.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
              if (latestAvatar?.publicUrl) {
                const readableUrl = formatFirebaseUrl(latestAvatar.publicUrl);
                if (readableUrl !== avatarUrl) {
                  updateUser({
                    avatar: readableUrl,
                    avatarUrl: readableUrl,
                    imageUrl: readableUrl,
                  } as any);
                }
              }
            }
          }
        } catch (err) {
          console.error('Lỗi đồng bộ avatar trên Navbar:', err);
        }
      };
      syncAvatar();
    }
  }, [isAuthenticated]);

  const dashboardPath = user ? resolveDashboardPath(user.role) : '/login';

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    await markAsRead(item.id);
    setNotifOpen(false);
    const targetUrl = getNotificationTargetUrl(item, user?.role);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };


  const roleLabels: Record<string, string> = {
    customer: roleLabel('customer'),
    garden_staff: roleLabel('garden_staff'),
    location_manager: roleLabel('location_manager'),
    manager: roleLabel('manager'),
    admin: roleLabel('admin'),
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Green<span className="text-green-600">Slot</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            {(!user || user.role === 'customer') && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/gardens" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">
                  Khám phá vườn
                </Link>
                <Link to="/how-it-works" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">
                  Cách hoạt động
                </Link>
                <Link to="/services" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">
                  Dịch vụ
                </Link>
                <Link to="/pricing" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">
                  Bảng giá
                </Link>
              </div>
            )}

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  {/* Notifications Dropdown */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="relative p-2 rounded-lg hover:bg-green-50 text-gray-600 hover:text-green-700 transition-colors"
                      title="Thông báo"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
                            {unreadCount > 0 && (
                              <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {unreadCount} mới
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => void markAllAsRead()}
                              className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 hover:underline"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Đã đọc tất cả
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                          {recentNotifications.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 px-4">
                              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 opacity-60" />
                              <p className="text-sm font-medium text-gray-500">Chưa có thông báo nào</p>
                              <p className="text-xs text-gray-400 mt-0.5">Bạn sẽ nhận thông báo khi có cập nhật mới</p>
                            </div>
                          ) : (
                            recentNotifications.map(item => {
                              const meta = getNotificationMeta(item.type, item.title);
                              const IconComponent = meta.icon;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => void handleNotificationClick(item)}
                                  className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 relative ${
                                    !item.isRead ? 'bg-green-50/30' : ''
                                  }`}
                                >
                                  {/* Icon */}
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bgClasses} ${meta.colorClasses}`}
                                  >
                                    <IconComponent className="w-4 h-4" />
                                  </div>

                                  {/* Text */}
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <p
                                        className={`text-xs truncate ${
                                          !item.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                                        }`}
                                      >
                                        {item.title}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                      {item.message}
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                      {formatRelativeTime(item.createdAt)}
                                    </span>
                                  </div>

                                  {/* Unread dot */}
                                  {!item.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                          <button
                            onClick={() => {
                              setNotifOpen(false);
                              const role = user?.role;
                              const notifPath =
                                role === 'manager' || role === 'location_manager'
                                  ? '/dashboard/staff/notifications'
                                  : role === 'garden_staff'
                                  ? '/dashboard/garden-staff/notifications'
                                  : role === 'admin'
                                  ? '/dashboard/admin/notifications'
                                  : '/dashboard/customer/notifications';
                              navigate(notifPath);
                            }}
                            className="text-xs text-green-700 hover:text-green-800 font-semibold inline-flex items-center gap-1.5 hover:underline"
                          >
                            Xem tất cả thông báo
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-green-200/60 shadow-sm">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user.name || 'Avatar'}
                            className="w-full h-full object-cover"
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}

                        <span className="text-green-700 font-semibold text-sm absolute inset-0 flex items-center justify-center -z-10 bg-green-100">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>

                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                        <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in duration-150">
                        <Link
                          to={dashboardPath}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Dashboard</span>
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Hồ sơ cá nhân</span>
                        </Link>
                        <hr className="border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Đăng xuất</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-green-50 text-gray-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-green-100 bg-white px-4 py-4 space-y-3">
            {(!user || user.role === 'customer') && (
              <>
                <Link to="/gardens" className="block text-gray-700 font-medium py-2">
                  Khám phá vườn
                </Link>
                <Link to="/how-it-works" className="block text-gray-700 font-medium py-2">
                  Cách hoạt động
                </Link>
                <Link to="/services" className="block text-gray-700 font-medium py-2">
                  Dịch vụ
                </Link>
                <Link to="/pricing" className="block text-gray-700 font-medium py-2">
                  Bảng giá
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} className="block text-green-600 font-medium py-2">
                  Dashboard
                </Link>
                <Link to="/dashboard/customer/notifications" className="flex items-center justify-between text-gray-700 font-medium py-2">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-600 font-medium py-2"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="btn-secondary flex-1 text-center text-sm">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary flex-1 text-center text-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="h-16 w-full" />
    </>
  );
}