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
export function getNotificationMeta(type?: string | null): NotificationMeta {
  const normalizedType = (type || '').trim().toUpperCase();

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
    if (normalizedType === 'HARVEST_READY' || normalizedType === 'HARVEST_CHOICE') {
      return {
        icon: Wheat,
        colorClasses: 'text-amber-600',
        bgClasses: 'bg-amber-50',
        borderClasses: 'border-amber-200',
        badgeLabel: 'Sẵn sàng thu hoạch',
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
      badgeLabel: 'Thu hoạch',
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
 * Get direct destination URL for a notification based on type and user role
 */
export function getNotificationTargetUrl(
  notification: { type?: string | null; actionUrl?: string | null; referenceId?: number | null },
  userRole?: string | null
): string {
  const role = (userRole || 'customer').toLowerCase();
  const t = (notification.type || '').trim().toUpperCase();

  // If a valid application actionUrl is present and matches existing client routes
  if (notification.actionUrl && notification.actionUrl.startsWith('/dashboard/')) {
    // Avoid non-existent dynamic routes like /dashboard/customer/rentals/123
    if (notification.actionUrl.startsWith('/dashboard/customer/rentals/')) {
      return '/dashboard/customer/rentals';
    }
    return notification.actionUrl;
  }

  // Garden staff role routing
  if (role === 'garden_staff') {
    if (t.includes('ALERT') || t.includes('IOT') || t.includes('SENSOR')) {
      return '/dashboard/garden-staff/alerts';
    }
    if (t.includes('HARVEST') && (t.includes('COMPLETED') || t.includes('DONE'))) {
      return '/dashboard/garden-staff/harvest-history';
    }
    if (t.startsWith('TASK_') || t.startsWith('HARVEST_')) {
      return '/dashboard/garden-staff';
    }
    if (t.startsWith('PUMP_')) {
      return '/dashboard/garden-staff/pump-control';
    }
    return '/dashboard/garden-staff';
  }

  // Manager / Location manager routing
  if (role === 'manager' || role === 'location_manager') {
    if (t.includes('ALERT') || t.includes('IOT') || t.includes('SENSOR')) {
      return '/dashboard/staff/alert-processing';
    }
    if (t.startsWith('TASK_')) {
      return '/dashboard/staff/tasks';
    }
    if (t.startsWith('PLANTING_') || t.startsWith('TREE_PLANTING_')) {
      return '/dashboard/staff/tree-planting';
    }
    if (t.startsWith('HARVEST_') || t.includes('HARVEST')) {
      return '/dashboard/staff/harvest-history';
    }
    if (t.startsWith('BOOKING_') || t.startsWith('RENTAL_') || t.startsWith('PAYMENT_')) {
      return '/dashboard/staff/rentals';
    }
    return '/dashboard/staff';
  }

  // Customer role (default)
  if (t.includes('ALERT') || t.includes('IOT') || t.includes('SENSOR')) {
    return '/dashboard/customer/monitoring';
  }
  if (t.startsWith('PLANTING_') || t.startsWith('TREE_PLANTING_')) {
    return '/dashboard/customer/tree-planting';
  }
  if (t.includes('HARVEST') && (t.includes('COMPLETED') || t.includes('DONE'))) {
    // Thông báo đã hoàn thành thu hoạch -> Chuyển về Lịch sử thu hoạch
    return '/dashboard/customer/harvest-history';
  }
  if (t.startsWith('HARVEST_') || t.startsWith('TASK_')) {
    // Thông báo sẵn sàng thu hoạch / chọn phương thức -> Chuyển về Vườn đang thuê để khách thao tác
    return '/dashboard/customer/rentals';
  }
  if (t.startsWith('BOOKING_') || t.startsWith('RENTAL_') || t.startsWith('PAYMENT_')) {
    return '/dashboard/customer/rentals';
  }

  return '/dashboard/customer/rentals';
}


