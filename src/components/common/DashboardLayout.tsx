import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronRight,
  UserCog,
  MapPin,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import clsx from 'clsx';
import { roleLabel } from '../../utils/roleMap';
import { formatFirebaseUrl } from '../../utils/firebaseUrl';
import { formatRelativeTime, getNotificationMeta, getNotificationTargetUrl } from '../../utils/notificationHelpers';
import { imageApi, UploadedImage } from '../../api/userApi';
import { NotificationItem } from '../../api/notificationApi';



interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles?: string[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

export default function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const { user, logout, updateUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = formatFirebaseUrl(
    user?.avatar || (user as any)?.publicUrl || (user as any)?.avatarUrl || (user as any)?.imageUrl
  );

  // Tự động đồng bộ ảnh avatar khi vừa vào bất kỳ trang Dashboard nào
  useEffect(() => {
    if (user) {
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
          console.error('Lỗi đồng bộ avatar trên Dashboard:', err);
        }
      };
      syncAvatar();
    }
  }, [user?.email]);

  const handleLogout = () => {
    logout();
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

  const roleColors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-700',
    garden_staff: 'bg-emerald-100 text-emerald-700',
    location_manager: 'bg-purple-100 text-purple-700',
    manager: 'bg-indigo-100 text-indigo-700',
    admin: 'bg-red-100 text-red-700',
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-all duration-300',
          'lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0 lg:ml-0' : '-translate-x-full lg:-ml-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              Green<span className="text-green-600">Slot</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-green-200/60 shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || 'Avatar'}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}

              <span className="text-green-700 font-bold absolute inset-0 flex items-center justify-center -z-10 bg-green-100">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', user ? roleColors[user.role] : '')}>
                  {user ? roleLabels[user.role] : ''}
                </span>
                {user?.locationName && (
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-0.5"
                    title="Cơ sở được chỉ định"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {user.locationName}
                  </span>
                )}
              </div>
            </div>
            <Link to="/dashboard/profile" title="Chỉnh sửa thông tin" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <UserCog className="w-4 h-4 text-gray-400 hover:text-green-600" />
            </Link>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Menu</p>
          <ul className="space-y-1">
            {navItems
              .filter(item => !item.roles || (user && item.roles.includes(user.role)))
              .map(item => {
                const isNotifItem = item.path.includes('notifications');
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === item.path
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isNotifItem && unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {location.pathname === item.path && !isNotifItem && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Notification Bell & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-700 transition-colors"
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
                        const meta = getNotificationMeta(item.type);
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

            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-green-600 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
            >
              Trang chủ
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}