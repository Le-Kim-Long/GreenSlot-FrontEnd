import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Inbox,
  X,
  ClipboardList,
  Calendar,
  Wifi,
  ShieldAlert,
  CheckCircle,
  History,
  Camera,
  TrendingUp,
  Users,
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { customerNavItems } from './customerNavItems';
import { staffNavItems } from '../manager/staffNav';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatRelativeTime,
  formatExactDateTime,
  getNotificationMeta,
  getNotificationTargetUrl,
  matchesCategory,
  NotificationCategory,
} from '../../utils/notificationHelpers';
import { NotificationItem } from '../../api/notificationApi';

const gardenStaffNavItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> },
];

const adminNavItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Camera Tổng', path: '/dashboard/staff/cameras/all', icon: <Camera className="w-full h-full" /> },
];

export default function CustomerNotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, refreshNotifications, markAsRead, markAllAsRead } =
    useNotification();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleItemAction = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    const targetUrl = getNotificationTargetUrl(item, user?.role);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };


  // Filter & Search & Sort
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(item => {
        // Category filter
        if (activeCategory === 'unread' && item.isRead) return false;
        if (activeCategory !== 'unread' && activeCategory !== 'all' && !matchesCategory(item.type, activeCategory)) {
          return false;
        }

        // Keyword search
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const titleMatch = (item.title || '').toLowerCase().includes(query);
          const messageMatch = (item.message || '').toLowerCase().includes(query);
          if (!titleMatch && !messageMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [notifications, activeCategory, searchTerm]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  // Tab definitions with dynamic counts
  const categoryTabs: { id: NotificationCategory; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất cả', count: notifications.length },
    { id: 'unread', label: 'Chưa đọc', count: unreadCount },
    {
      id: 'iot',
      label: 'Cảnh báo IoT',
      count: notifications.filter(n => matchesCategory(n.type, 'iot')).length,
    },
    {
      id: 'harvest',
      label: 'Thu hoạch & Chăm sóc',
      count: notifications.filter(n => matchesCategory(n.type, 'harvest')).length,
    },
    {
      id: 'rental',
      label: 'Hợp đồng & Đặt thuê',
      count: notifications.filter(n => matchesCategory(n.type, 'rental')).length,
    },
    {
      id: 'planting',
      label: 'Trồng cây & Dịch vụ',
      count: notifications.filter(n => matchesCategory(n.type, 'planting')).length,
    },
  ];

  const resolvedNavItems =
    user?.role === 'garden_staff'
      ? gardenStaffNavItems
      : user?.role === 'manager' || user?.role === 'location_manager'
      ? staffNavItems
      : user?.role === 'admin'
      ? adminNavItems
      : customerNavItems;

  return (
    <DashboardLayout navItems={resolvedNavItems} title="Trung tâm thông báo">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
            <Bell className="w-64 h-64 text-white -mr-16 -mt-10" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Hệ thống thông báo thời gian thực
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trung tâm thông báo</h1>
              <p className="text-green-50 text-sm max-w-xl leading-relaxed">
                Theo dõi tức thời tiến độ chăm sóc cây, cập nhật thu hoạch, hạn hợp đồng thuê ô vườn và các cảnh báo cảm biến IoT.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex flex-wrap items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="px-4 py-2.5 bg-white text-green-700 hover:bg-green-50 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4 text-green-600" />
                  Đã đọc tất cả ({unreadCount})
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/20"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung thông báo..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-600 font-medium whitespace-nowrap self-start sm:self-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span>Hiển thị: </span>
              <strong className="text-gray-900">{filteredNotifications.length}</strong> / {notifications.length}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categoryTabs.map(tab => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-sm shadow-green-600/20 ring-2 ring-green-600/20'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : tab.id === 'unread'
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Đang tải thông báo từ hệ thống...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <Inbox className="w-8 h-8 opacity-60" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-bold text-gray-800 text-base">Không tìm thấy thông báo nào</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {searchTerm || activeCategory !== 'all'
                  ? 'Không có thông báo phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.'
                  : 'Bạn hiện chưa có thông báo mới nào từ hệ thống và các ô vườn.'}
              </p>
            </div>
            {(searchTerm || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Xóa bộ lọc & Đặt lại
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedNotifications.map(item => {
                const meta = getNotificationMeta(item.type, item.title);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 border ${
                      !item.isRead
                        ? 'bg-white border-green-200 shadow-md shadow-green-600/5 ring-1 ring-green-100/80 hover:border-green-300'
                        : 'bg-white/80 border-gray-100 shadow-sm hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Icon Box */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${meta.bgClasses} ${meta.colorClasses} ${meta.borderClasses}`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Top Badges & Meta */}
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.bgClasses} ${meta.colorClasses} ${meta.borderClasses}`}
                            >
                              {meta.badgeLabel}
                            </span>

                            {!item.isRead && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Chưa đọc
                              </span>
                            )}

                            {item.referenceId && (
                              <span className="text-[11px] text-gray-400 font-mono">
                                #Ref-{item.referenceId}
                              </span>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right" title={formatExactDateTime(item.createdAt)}>
                            <span className="text-xs font-medium text-gray-500">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              {formatExactDateTime(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h2
                          className={`text-sm sm:text-base ${
                            !item.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
                          }`}
                        >
                          {item.title}
                        </h2>

                        {/* Message body */}
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words whitespace-pre-line">
                          {item.message}
                        </p>

                        {/* Bottom Action Row */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 mt-3">
                          <div className="flex items-center gap-2">
                            {/* Deep Link Action */}
                            {(item.actionUrl || item.referenceId) && (
                              <button
                                onClick={() => void handleItemAction(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <span>{meta.defaultActionLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Read Toggle */}
                          {!item.isRead && (
                            <button
                              onClick={() => void markAsRead(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-xl text-xs font-medium transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              <span>Đánh dấu đã đọc</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredNotifications.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemName="thông báo"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
