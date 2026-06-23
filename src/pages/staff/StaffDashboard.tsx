import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Columns3, Grid3X3, Wrench, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Stats {
  locations: number;
  pillars: number;
  slots: number;
  availableSlots: number;
  serviceCategories: number;
  serviceTypes: number;
  activeRentals: number;
  totalRevenue: number;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ locations: 0, pillars: 0, slots: 0, availableSlots: 0, serviceCategories: 0, serviceTypes: 0, activeRentals: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [locations, pillars, slots, categories, types, rentals, revenue] = await Promise.all([
          managerApi.getLocations().catch(() => []),
          managerApi.getPillars().catch(() => []),
          managerApi.getSlots().catch(() => []),
          managerApi.getServiceCategories().catch(() => []),
          managerApi.getServiceTypes().catch(() => []),
          managerApi.getActiveRentals().catch(() => []),
          managerApi.getRevenue('2024-01-01', new Date().toISOString().split('T')[0]).catch(() => ({ totalRevenue: 0 })),
        ]);
        setStats({
          locations: locations.length,
          pillars: pillars.length,
          slots: slots.length,
          availableSlots: slots.filter((s: { status: string }) => s.status === 'AVAILABLE').length,
          serviceCategories: categories.length,
          serviceTypes: types.length,
          activeRentals: rentals.length,
          totalRevenue: revenue.totalRevenue || 0,
        });
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Cơ sở', value: stats.locations, icon: <MapPin className="w-6 h-6" />, bg: 'bg-green-50 text-green-600', link: '/dashboard/staff/locations' },
    { label: 'Trụ vườn', value: stats.pillars, icon: <Columns3 className="w-6 h-6" />, bg: 'bg-purple-50 text-purple-600', link: '/dashboard/staff/pillars' },
    { label: 'Ô vườn', value: `${stats.availableSlots}/${stats.slots}`, icon: <Grid3X3 className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600', link: '/dashboard/staff/slots', sublabel: 'trống/tổng' },
    { label: 'Đang thuê', value: stats.activeRentals, icon: <Calendar className="w-6 h-6" />, bg: 'bg-orange-50 text-orange-600', link: '/dashboard/staff/rentals' },
    { label: 'Loại dịch vụ', value: stats.serviceTypes, icon: <Wrench className="w-6 h-6" />, bg: 'bg-cyan-50 text-cyan-600', link: '/dashboard/staff/services' },
    { label: 'Doanh thu', value: `${(stats.totalRevenue / 1000000).toFixed(1)}tr`, icon: <DollarSign className="w-6 h-6" />, bg: 'bg-emerald-50 text-emerald-600', link: '/dashboard/staff/revenue' },
  ];

  const quickActions = [
    { label: 'Quản lý cơ sở', desc: 'Thêm, sửa thông tin cơ sở', path: '/dashboard/staff/locations', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Quản lý ô vườn', desc: 'Thêm, sửa ô vườn và giá', path: '/dashboard/staff/slots', icon: <Grid3X3 className="w-5 h-5" /> },
    { label: 'Quản lý dịch vụ', desc: 'Danh mục & loại dịch vụ', path: '/dashboard/staff/services', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Xem doanh thu', desc: 'Phân tích doanh thu theo ngày', path: '/dashboard/staff/revenue', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout navItems={staffNavItems} title="Dashboard Quản lý">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}!</h2>
        <p className="text-purple-100 text-sm">Tổng quan hệ thống GreenSlot. Quản lý cơ sở, ô vườn và dịch vụ.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {statCards.map((s, i) => (
              <Link key={i} to={s.link} className="card hover:border-green-200 transition-colors group">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>{s.icon}</div>
                <div className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
                {s.sublabel && <div className="text-xs text-gray-400">{s.sublabel}</div>}
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map(a => (
                <Link key={a.path} to={a.path} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-green-600 transition-colors">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{a.label}</div>
                    <div className="text-xs text-gray-500">{a.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
