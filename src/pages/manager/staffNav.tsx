import {
  TrendingUp,
  MapPin,
  Columns3,
  Grid3X3,
  Wrench,
  Calendar,
  Cpu,
  Trees,
  Sprout,
  DollarSign,
  ClipboardList, // Thêm icon cho Task
  Users,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

export const staffNavItems = [
  { label: 'Tổng quan', path: '/dashboard/staff', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Cơ sở', path: '/dashboard/staff/locations', icon: <MapPin className="w-full h-full" /> },
  { label: 'Trụ vườn', path: '/dashboard/staff/pillars', icon: <Columns3 className="w-full h-full" /> },
  { label: 'Ô vườn', path: '/dashboard/staff/slots', icon: <Grid3X3 className="w-full h-full" /> },
  { label: 'Dịch vụ', path: '/dashboard/staff/services', icon: <Wrench className="w-full h-full" /> },
  { label: 'Đang thuê', path: '/dashboard/staff/rentals', icon: <Calendar className="w-full h-full" /> },
  { label: 'Công việc', path: '/dashboard/staff/tasks', icon: <ClipboardList className="w-full h-full" /> }, // Đã thêm mục Quản lý Task
  { label: 'Nhân viên', path: '/dashboard/staff/staffs', icon: <Users className="w-full h-full" /> },
  { label: 'Doanh thu', path: '/dashboard/staff/revenue', icon: <DollarSign className="w-full h-full" /> },
  { label: 'Thống kê Cảnh báo', path: '/dashboard/staff/alert-analytics', icon: <AlertTriangle className="w-full h-full" /> },
  { label: 'Xử lý Cảnh báo', path: '/dashboard/staff/alert-processing', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Thiết bị IoT', path: '/dashboard/staff/equipment', icon: <Cpu className="w-full h-full" /> },
  { label: 'Cây trồng', path: '/dashboard/staff/trees', icon: <Trees className="w-full h-full" /> },
  { label: 'Yêu cầu trồng cây', path: '/dashboard/staff/tree-planting', icon: <Sprout className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/staff/schedules', icon: <Calendar className="w-full h-full" /> },
];