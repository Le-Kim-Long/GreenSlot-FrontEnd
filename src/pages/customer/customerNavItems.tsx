import { Leaf, Wifi, TrendingUp, CreditCard, Bell, Sprout, Grid3X3, History } from 'lucide-react';

export const customerNavItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Thuê ô vườn mới', path: '/gardens', icon: <Grid3X3 className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Yêu cầu trồng cây', path: '/dashboard/customer/tree-planting', icon: <Sprout className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/customer/harvest-history', icon: <History className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];
