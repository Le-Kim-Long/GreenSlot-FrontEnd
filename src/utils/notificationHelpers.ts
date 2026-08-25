import {
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  Sprout,
  Wheat,
  ShoppingBag,
  CalendarCheck,
  CalendarClock,
  AlertTriangle,
  AlertOctagon,
  Bell,
  FileText,
  LucideIcon,
} from 'lucide-react';

export type NotificationCategory = 'all' | 'unread' | 'iot' | 'harvest' | 'rental' | 'planting' | 'task' | 'system';

export interface NotificationMeta {
  icon: LucideIcon;
  colorClasses: string; // Text color e.g. text-emerald-600
  bgClasses: string;    // Light background e.g. bg-emerald-50
  borderClasses: string;// Border color e.g. border-emerald-200
  badgeLabel: string;   // Vietnamese badge e.g. "Thu hoạch"
  category: NotificationCategory;
  defaultActionLabel: string;
}

/**
 * Format relative time in Vietnamese ("Vừa xong", "X phút trước", "X giờ trước", "Hôm qua lúc HH:mm", "DD/MM/YYYY")
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 0 || diffInSec < 60) {
    return 'Vừa xong';
  }

  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) {
    return `${diffInMin} phút trước`;
  }

  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (diffInDays === 1) {
    return `Hôm qua lúc ${hours}:${minutes}`;
  }

  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
}

/**
 * Format full exact date time in Vietnamese format: "DD/MM/YYYY - HH:mm:ss"
 */
export function formatExactDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

/**
 * Get category, icon, and colors for a notification type
 */
export function getNotificationMeta(type?: string | null, title?: string | null): NotificationMeta {
  const normalizedType = (type || '').trim().toUpperCase();
  const normalizedTitle = (title || '').trim().toLowerCase();

  // 1. Task Lifecycle
  if (normalizedType.startsWith('TASK_')) {
    if (normalizedType === 'TASK_APPROVED' || normalizedType === 'TASK_COMPLETED') {
      return {
        icon: CheckCircle2,
        colorClasses: 'text-emerald-600',
        bgClasses: 'bg-emerald-50',
        borderClasses: 'border-emerald-200',
        badgeLabel: 'Nhiệm vụ đã duyệt',
        category: 'task',
        defaultActionLabel: 'Xem ô vườn',
      };
    }
    if (normalizedType === 'TASK_REJECTED') {
      return {
        icon: XCircle,
        colorClasses: 'text-rose-600',
        bgClasses: 'bg-rose-50',
        borderClasses: 'border-rose-200',
        badgeLabel: 'Nhiệm vụ bị từ chối',
        category: 'task',
        defaultActionLabel: 'Xem chi tiết',
      };
    }
    if (normalizedType === 'TASK_SUBMITTED') {
      return {
        icon: Clock,
        colorClasses: 'text-blue-600',
        bgClasses: 'bg-blue-50',
        borderClasses: 'border-blue-200',
        badgeLabel: 'Đã nộp bằng chứng',
        category: 'task',
        defaultActionLabel: 'Xem ô vườn',
      };
    }
    return {
      icon: ClipboardList,
      colorClasses: 'text-teal-600',
      bgClasses: 'bg-teal-50',
      borderClasses: 'border-teal-200',
      badgeLabel: 'Nhiệm vụ chăm sóc',
      category: 'task',
      defaultActionLabel: 'Xem nhiệm vụ',
    };
  }

  // 2. Harvest Lifecycle
  if (normalizedType.startsWith('HARVEST_')) {
    const isEarly = normalizedType.includes('EARLY') || normalizedTitle.includes('sớm');
    if (normalizedType === 'HARVEST_READY' || normalizedType === 'HARVEST_CHOICE') {
      return {
        icon: Wheat,
        colorClasses: 'text-amber-600',
        bgClasses: 'bg-amber-50',
        borderClasses: 'border-amber-200',
        badgeLabel: isEarly ? '⚡ Sẵn sàng thu hoạch sớm' : 'Sẵn sàng thu hoạch',
        category: 'harvest',
        defaultActionLabel: 'Chọn phương án',
      };
    }
    if (normalizedType === 'HARVEST_COMPLETED') {
      return {
        icon: ShoppingBag,
        colorClasses: 'text-green-600',
        bgClasses: 'bg-green-50',
        borderClasses: 'border-green-200',
        badgeLabel: 'Đã hoàn thành thu hoạch',
        category: 'harvest',
        defaultActionLabel: 'Xem ô vườn',
      };
    }
    return {
      icon: Wheat,
      colorClasses: 'text-amber-600',
      bgClasses: 'bg-amber-50',
      borderClasses: 'border-amber-200',
      badgeLabel: isEarly ? '⚡ Thu hoạch sớm' : 'Thu hoạch',
      category: 'harvest',
      defaultActionLabel: 'Xem thu hoạch',
    };
  }

  // 3. Planting Requests
  if (normalizedType.startsWith('PLANTING_') || normalizedType.startsWith('TREE_PLANTING_')) {
    if (normalizedType.includes('APPROVED')) {
      return {
        icon: Sprout,
        colorClasses: 'text-emerald-600',
        bgClasses: 'bg-emerald-50',
        borderClasses: 'border-emerald-200',
        badgeLabel: 'Yêu cầu trồng đã duyệt',
        category: 'planting',
        defaultActionLabel: 'Xem yêu cầu',
      };
    }
    if (normalizedType.includes('REJECTED')) {
      return {
        icon: XCircle,
        colorClasses: 'text-red-600',
        bgClasses: 'bg-red-50',
        borderClasses: 'border-red-200',
        badgeLabel: 'Yêu cầu trồng bị từ chối',
        category: 'planting',
        defaultActionLabel: 'Xem yêu cầu',
      };
    }
    return {
      icon: Sprout,
      colorClasses: 'text-green-600',
      bgClasses: 'bg-green-50',
      borderClasses: 'border-green-200',
      badgeLabel: 'Yêu cầu trồng cây',
      category: 'planting',
      defaultActionLabel: 'Xem yêu cầu',
    };
  }

  // 4. Booking & Rental Expiration
  if (normalizedType.startsWith('BOOKING_') || normalizedType.startsWith('RENTAL_')) {
    if (normalizedType === 'BOOKING_SUCCESS') {
      return {
        icon: CalendarCheck,
        colorClasses: 'text-indigo-600',
        bgClasses: 'bg-indigo-50',
        borderClasses: 'border-indigo-200',
        badgeLabel: 'Đặt thuê thành công',
        category: 'rental',
        defaultActionLabel: 'Xem hợp đồng',
      };
    }
    if (normalizedType.includes('EXPIRING') || normalizedType.includes('EXPIRED')) {
      return {
        icon: CalendarClock,
        colorClasses: 'text-orange-600',
        bgClasses: 'bg-orange-50',
        borderClasses: 'border-orange-200',
        badgeLabel: 'Cảnh báo hết hạn thuê',
        category: 'rental',
        defaultActionLabel: 'Gia hạn thuê',
      };
    }
    return {
      icon: FileText,
      colorClasses: 'text-blue-600',
      bgClasses: 'bg-blue-50',
      borderClasses: 'border-blue-200',
      badgeLabel: 'Hợp đồng thuê',
      category: 'rental',
      defaultActionLabel: 'Xem hợp đồng',
    };
  }

  // 5. IoT & Alert
  if (normalizedType.startsWith('IOT_') || normalizedType.startsWith('ALERT_') || normalizedType.includes('SENSOR')) {
    if (normalizedType === 'ALERT_ESCALATED') {
      return {
        icon: AlertOctagon,
        colorClasses: 'text-red-700',
        bgClasses: 'bg-red-100',
        borderClasses: 'border-red-300',
        badgeLabel: 'Cảnh báo IoT khẩn cấp',
        category: 'iot',
        defaultActionLabel: 'Kiểm tra cảm biến',
      };
    }
    return {
      icon: AlertTriangle,
      colorClasses: 'text-red-600',
      bgClasses: 'bg-red-50',
      borderClasses: 'border-red-200',
      badgeLabel: 'Cảnh báo IoT',
      category: 'iot',
      defaultActionLabel: 'Xem cảm biến',
    };
  }

  // Default / System Fallback
  return {
    icon: Bell,
    colorClasses: 'text-gray-600',
    bgClasses: 'bg-gray-50',
    borderClasses: 'border-gray-200',
    badgeLabel: 'Thông báo',
    category: 'system',
    defaultActionLabel: 'Xem chi tiết',
  };
}

/**
 * Filter notifications by category
 */
export function matchesCategory(type: string | undefined, category: NotificationCategory): boolean {
  if (category === 'all' || category === 'unread') return true;
  const meta = getNotificationMeta(type);
  if (category === 'harvest' && (meta.category === 'harvest' || meta.category === 'task')) return true;
  return meta.category === category;
}

/**
 * Get direct destination URL for a notification based on type, actionUrl, title, message, and user role
 */
export function getNotificationTargetUrl(
  notification: {
    type?: string | null;
    actionUrl?: string | null;
    referenceId?: number | null;
    title?: string | null;
    message?: string | null;
  },
  userRole?: string | null
): string {
  const role = (userRole || 'customer').toLowerCase();
  const t = (notification.type || '').trim().toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();
  let rawUrl = (notification.actionUrl || '').trim();

  // 1. Sanitize & Normalize legacy or malformed backend URLs
  if (rawUrl) {
    // Replace legacy manager paths with staff paths
    rawUrl = rawUrl.replace('/dashboard/manager/tree-requests', '/dashboard/staff/tree-planting');
    rawUrl = rawUrl.replace('/dashboard/manager/alerts', '/dashboard/staff/alert-processing');
    rawUrl = rawUrl.replace('/dashboard/manager/tasks', '/dashboard/staff/tasks');
    rawUrl = rawUrl.replace('/dashboard/manager/schedules', '/dashboard/staff/schedules');
    rawUrl = rawUrl.replace('/dashboard/manager/rentals', '/dashboard/staff/rentals');
    rawUrl = rawUrl.replace('/dashboard/manager', '/dashboard/staff');

    // Replace incorrect customer paths
    rawUrl = rawUrl.replace('/dashboard/customer/iot', '/dashboard/customer/monitoring');
    rawUrl = rawUrl.replace('/dashboard/customer/sensors', '/dashboard/customer/monitoring');

    // Strip trailing dynamic IDs that don't have dedicated subroutes
    if (rawUrl.startsWith('/dashboard/customer/rentals/')) {
      rawUrl = '/dashboard/customer/rentals';
    }
    if (rawUrl.startsWith('/dashboard/customer/tree-planting/')) {
      rawUrl = '/dashboard/customer/tree-planting';
    }
    if (rawUrl.startsWith('/dashboard/staff/tasks/')) {
      rawUrl = '/dashboard/staff/tasks';
    }
    if (rawUrl.startsWith('/dashboard/staff/tree-planting/')) {
      rawUrl = '/dashboard/staff/tree-planting';
    }
  }

  // 2. Role-specific routing

  // --- GARDEN STAFF ---
  if (role === 'garden_staff') {
    // IoT Alerts & Sensors
    if (t.includes('ALERT') || t.includes('IOT') || t.includes('SENSOR') || text.includes('cảm biến') || text.includes('cảnh báo')) {
      return '/dashboard/garden-staff/alerts';
    }
    // Pump control & Auto watering
    if (t.startsWith('PUMP_') || t.includes('WATERING') || text.includes('bơm') || text.includes('tưới')) {
      return '/dashboard/garden-staff/pump-control';
    }
    // Harvest history
    if (
      (t.includes('HARVEST') && (t.includes('COMPLETED') || t.includes('DONE'))) ||
      text.includes('hoàn tất thu hoạch') ||
      text.includes('đã thu hoạch')
    ) {
      return '/dashboard/garden-staff/harvest-history';
    }
    // Schedules
    if (t.startsWith('SCHEDULE_') || text.includes('lịch trực')) {
      return '/dashboard/garden-staff/schedules';
    }
    // Tasks, assignments & active harvest requests
    if (
      t.startsWith('TASK_') ||
      t.includes('HARVEST') ||
      t.includes('CARE') ||
      text.includes('nhiệm vụ') ||
      text.includes('phân công') ||
      text.includes('thu hoạch')
    ) {
      return '/dashboard/garden-staff'; // Task workspace
    }
    // Camera
    if (t.includes('CAMERA') || text.includes('camera')) {
      return '/dashboard/garden-staff/cameras';
    }
    return '/dashboard/garden-staff';
  }

  // --- MANAGER / LOCATION MANAGER ---
  if (role === 'manager' || role === 'location_manager') {
    // IoT Alerts
    if (t.includes('ALERT') || t.includes('IOT') || t.includes('SENSOR') || text.includes('cảm biến') || text.includes('cảnh báo')) {
      return '/dashboard/staff/alert-processing';
    }
    // Tree planting requests
    if (
      t.startsWith('PLANTING_') ||
      t.startsWith('TREE_PLANTING_') ||
      t.includes('PLANT') ||
      text.includes('trồng cây') ||
      text.includes('gieo giống')
    ) {
      return '/dashboard/staff/tree-planting';
    }
    // Harvest history & decisions
    if (t.startsWith('HARVEST_') || t.includes('HARVEST') || text.includes('thu hoạch')) {
      return '/dashboard/staff/harvest-history';
    }
    // Tasks & issues & services
    if (
      t.startsWith('TASK_') ||
      t.startsWith('SERVICE_') ||
      t.startsWith('PILLAR_SETUP') ||
      text.includes('nhiệm vụ') ||
      text.includes('sự cố') ||
      text.includes('dịch vụ') ||
      text.includes('lắp đặt')
    ) {
      return '/dashboard/staff/tasks';
    }
    // Financial / Revenue (Manager) or Rentals (Location Manager)
    if (t.startsWith('PAYMENT_') || t.startsWith('REVENUE_') || text.includes('thanh toán') || text.includes('doanh thu')) {
      return role === 'manager' ? '/dashboard/staff/revenue' : '/dashboard/staff/rentals';
    }
    // Rentals & Bookings
    if (t.startsWith('BOOKING_') || t.startsWith('RENTAL_') || text.includes('hợp đồng') || text.includes('thuê')) {
      return '/dashboard/staff/rentals';
    }
    // Schedules & Staff
    if (t.startsWith('SCHEDULE_') || t.startsWith('STAFF_') || text.includes('lịch trực') || text.includes('nhân viên')) {
      return '/dashboard/staff/schedules';
    }
    // Equipment
    if (t.startsWith('EQUIPMENT_') || text.includes('thiết bị')) {
      return '/dashboard/staff/equipment';
    }
    // Cameras
    if (t.includes('CAMERA') || text.includes('camera')) {
      return role === 'manager' ? '/dashboard/staff/cameras' : '/dashboard/staff/cameras/all';
    }

    // If normalized URL is a valid staff route, use it
    if (rawUrl && rawUrl.startsWith('/dashboard/staff/')) {
      return rawUrl;
    }

    return '/dashboard/staff';
  }

  // --- ADMIN ---
  if (role === 'admin') {
    if (t.includes('USER') || text.includes('người dùng') || text.includes('tài khoản')) {
      return '/dashboard/admin/users';
    }
    if (t.includes('CAMERA') || text.includes('camera')) {
      return '/dashboard/staff/cameras/all';
    }
    if (t.includes('ALERT') || t.includes('IOT')) {
      return '/dashboard/staff/alert-processing';
    }
    return '/dashboard/admin';
  }

  // --- CUSTOMER (Default) ---
  // IoT Monitoring & Auto watering
  if (
    t.includes('ALERT') ||
    t.includes('IOT') ||
    t.includes('SENSOR') ||
    t.includes('WATERING') ||
    text.includes('cảm biến') ||
    text.includes('chỉ số') ||
    text.includes('tưới cây') ||
    text.includes('sinh trưởng')
  ) {
    return '/dashboard/customer/monitoring';
  }

  // Tree planting requests
  if (
    t.startsWith('PLANTING_') ||
    t.startsWith('TREE_PLANTING_') ||
    t.includes('PLANT') ||
    text.includes('trồng cây') ||
    text.includes('gieo giống')
  ) {
    return '/dashboard/customer/tree-planting';
  }

  // Harvest completed -> Harvest history
  if (
    (t.includes('HARVEST') && (t.includes('COMPLETED') || t.includes('DONE') || t.includes('STORED') || t.includes('RECEIVED'))) ||
    text.includes('đã thu hoạch') ||
    text.includes('hoàn tất thu hoạch')
  ) {
    return '/dashboard/customer/harvest-history';
  }

  // Harvest ready / choice / reminder -> Active rentals (where user chooses harvest method)
  if (t.startsWith('HARVEST_') || text.includes('thu hoạch')) {
    return '/dashboard/customer/rentals';
  }

  // Payments & Invoices
  if (t.startsWith('PAYMENT_') || text.includes('thanh toán') || text.includes('hóa đơn') || text.includes('giao dịch')) {
    return '/dashboard/customer/payments';
  }

  // Rentals & Bookings & Care tasks progress
  if (
    t.startsWith('BOOKING_') ||
    t.startsWith('RENTAL_') ||
    t.startsWith('TASK_') ||
    t.startsWith('SERVICE_') ||
    text.includes('hợp đồng') ||
    text.includes('thuê') ||
    text.includes('chăm sóc') ||
    text.includes('dịch vụ')
  ) {
    return '/dashboard/customer/rentals';
  }

  // Cameras
  if (t.includes('CAMERA') || text.includes('camera')) {
    return '/dashboard/customer/cameras';
  }

  if (rawUrl && rawUrl.startsWith('/dashboard/customer/')) {
    return rawUrl;
  }

  return '/dashboard/customer/rentals';
}


