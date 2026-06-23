import { TrendingUp, MapPin, Columns3, Grid3X3, Wrench, Calendar, DollarSign } from 'lucide-react';

export const staffNavItems = [
  { label: 'Tổng quan', path: '/dashboard/staff', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Cơ sở', path: '/dashboard/staff/locations', icon: <MapPin className="w-full h-full" /> },
  { label: 'Trụ vườn', path: '/dashboard/staff/pillars', icon: <Columns3 className="w-full h-full" /> },
  { label: 'Ô vườn', path: '/dashboard/staff/slots', icon: <Grid3X3 className="w-full h-full" /> },
  { label: 'Dịch vụ', path: '/dashboard/staff/services', icon: <Wrench className="w-full h-full" /> },
  { label: 'Đang thuê', path: '/dashboard/staff/rentals', icon: <Calendar className="w-full h-full" /> },
  { label: 'Doanh thu', path: '/dashboard/staff/revenue', icon: <DollarSign className="w-full h-full" /> },
];
