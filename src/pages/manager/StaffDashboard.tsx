import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Columns3, Grid3X3, Wrench, DollarSign, TrendingUp, Calendar, ArrowRight, ClipboardList, Layers, User, ShieldAlert, CheckCircle2, AlertTriangle, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { managerApi, LocationDashboardMetrics, RevenueAnalyticsResponse } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const OCCUPANCY_COLORS = ['#16a34a', '#e2e8f0']; // Xanh (Đang thuê) vs Xám (Trống)

interface Stats {
  locations: number;
  pillars: number;
  slots: number;
  availableSlots: number;
  serviceCategories: number;
  serviceTypes: number;
  activeRentals: number;
  totalRevenue: number;
  totalTasks: number;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ locations: 0, pillars: 0, slots: 0, availableSlots: 0, serviceCategories: 0, serviceTypes: 0, activeRentals: 0, totalRevenue: 0, totalTasks: 0 });
  
  // 👉 State Mới cho Chức năng theo Cơ sở (Location Metrics)
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(() => user?.locationId || 1);
  const [metrics, setMetrics] = useState<LocationDashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  // Mặc định lọc ngày từ ngày 1 của tháng hiện tại tới hôm nay
  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

  // 1. Tải chỉ số tổng quan toàn hệ thống (Global Stats)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // GET /manager/analytics/revenue chỉ dành cho role manager (backend chặn location_manager) —
        // chỉ gọi khi đúng role để tránh request chắc chắn lỗi 400
        const [locations, pillars, slots, categories, types, rentals, revenue, tasks] = await Promise.all([
          managerApi.getLocations().catch(() => []),
          managerApi.getPillars().catch(() => []),
          managerApi.getSlots().catch(() => []),
          managerApi.getServiceCategories().catch(() => []),
          managerApi.getServiceTypes().catch(() => []),
          managerApi.getActiveRentals().catch(() => []),
          user?.role === 'manager'
            ? managerApi.getRevenue('2024-01-01', new Date().toISOString().split('T')[0]).catch(() => ({ totalRevenue: 0 }))
            : Promise.resolve({ totalRevenue: 0 }),
          Promise.resolve([]),
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
          totalTasks: tasks.length || 0,
        });

        // Thiết lập danh sách Locations cho Dropdown
        if (locations.length > 0) {
          setLocationsList(locations);
          const targetLoc = user?.locationId ? locations.find((l: any) => l.id === user.locationId) || locations[0] : locations[0];
          setSelectedLocationId(targetLoc.id);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchStats();
  }, [user?.locationId, user?.role]);

  // 2. Tải số liệu chuyên sâu theo từng Cơ sở (Location Metrics) khi chọn cơ sở hoặc đổi ngày
  useEffect(() => {
    if (!selectedLocationId) return;
    const fetchLocationMetrics = async () => {
      setLocationLoading(true);
      try {
        const [metricsRes, revenueRes] = await Promise.all([
          managerApi.getLocationMetrics(selectedLocationId).catch(() => null),
          managerApi.getLocationRevenueMetrics(selectedLocationId, startDate, endDate).catch(() => null),
        ]);
        setMetrics(metricsRes);
        setRevenueData(revenueRes);
      } catch (err) {
        console.error('Lỗi tải số liệu chi tiết cơ sở:', err);
      } finally {
        setLocationLoading(false);
      }
    };
    fetchLocationMetrics();
  }, [selectedLocationId, startDate, endDate]);

  // Tính toán dữ liệu Biểu đồ Tỷ lệ Lấp đầy
  const totalSlots = metrics?.totalSlots || (metrics?.activeRentals || 0) + (metrics?.availableSlots || 0) || 10;
  const activeRentalsCount = metrics?.activeRentals || 0;
  const availableSlotsCount = metrics?.availableSlots ?? (totalSlots - activeRentalsCount);

  const occupancyData = [
    { name: 'Đang cho thuê', value: activeRentalsCount },
    { name: 'Còn trống', value: availableSlotsCount < 0 ? 0 : availableSlotsCount },
  ];

  const statCards = [
    { label: 'Cơ sở', value: stats.locations, icon: <MapPin className="w-6 h-6" />, bg: 'bg-green-50 text-green-600', link: '/dashboard/staff/locations' },
    { label: 'Trụ vườn', value: stats.pillars, icon: <Columns3 className="w-6 h-6" />, bg: 'bg-purple-50 text-purple-600', link: '/dashboard/staff/pillars' },
    { label: 'Ô vườn', value: `${stats.availableSlots}/${stats.slots}`, icon: <Grid3X3 className="w-6 h-6" />, bg: 'bg-blue-50 text-blue-600', link: '/dashboard/staff/slots', sublabel: 'trống/tổng' },
    { label: 'Đang thuê', value: stats.activeRentals, icon: <Calendar className="w-6 h-6" />, bg: 'bg-orange-50 text-orange-600', link: '/dashboard/staff/rentals' },
    { label: 'Loại dịch vụ', value: stats.serviceTypes, icon: <Wrench className="w-6 h-6" />, bg: 'bg-cyan-50 text-cyan-600', link: '/dashboard/staff/services' },
    { label: 'Công việc', value: stats.totalTasks, icon: <ClipboardList className="w-6 h-6" />, bg: 'bg-yellow-50 text-yellow-600', link: '/dashboard/staff/tasks' },
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white mb-6 shadow-md">
        <h2 className="text-xl font-bold mb-1">Xin chào, {user?.name}!</h2>
        <p className="text-purple-100 text-sm">Tổng quan hệ thống GreenSlot. Quản lý cơ sở, ô vườn, dịch vụ và theo dõi số liệu IoT.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang tải dữ liệu tổng quan...</p>
        </div>
      ) : (
        <>
          {/* 1. Global Stats Cards */}
          {user?.role === 'manager' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
              {statCards.map((s, i) => (
                <Link key={i} to={s.link} className="card hover:border-green-200 transition-colors group">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>{s.icon}</div>
                  <div className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  {s.sublabel && <div className="text-xs text-gray-400">{s.sublabel}</div>}
                </Link>
              ))}
            </div>
          )}

          {/* 💥 2. KHU VỰC SỐ LIỆU CHUYÊN SOU THEO CƠ SỞ (LOCATION METRICS) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
            
            {/* Thanh chọn Cơ sở & Thời gian */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-bold text-gray-700">Phân tích Cơ sở:</span>
                <select
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                  disabled={user?.role !== 'manager'}
                >
                  {locationsList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name || loc.locationName || `Cơ sở #${loc.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                <input
                  type="date"
                  className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-400 font-bold">—</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {locationLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Đang tải số liệu chi tiết cơ sở...</div>
            ) : metrics ? (
              <>
                {/* 4 Thẻ Chỉ Số Nhanh của riêng Cơ Sở */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 className="w-5 h-5"/></div>
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase">Đang cho thuê</div>
                        <div className="text-xl font-black text-gray-900">{metrics.activeRentals} <span className="text-xs font-normal text-gray-500">ô</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Layers className="w-5 h-5"/></div>
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase">Tổng ô / Trống</div>
                        <div className="text-xl font-black text-gray-900">{totalSlots} <span className="text-xs font-normal text-gray-500">/ {availableSlotsCount} trống</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0"><AlertTriangle className="w-5 h-5"/></div>
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase">Cảnh báo IoT chờ</div>
                        <div className="text-xl font-black text-amber-600">{metrics.pendingAlerts} <span className="text-xs font-normal text-gray-500">vụ</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><DollarSign className="w-5 h-5"/></div>
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase">Doanh thu kỳ này</div>
                        <div className="text-xl font-black text-green-600">{(revenueData?.totalRevenue || 0).toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 💥 2 BIỂU ĐỒ SONG SONG: Tỷ lệ lấp đầy & Doanh thu cơ sở */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <PieIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900 text-base">Tỷ lệ lấp đầy Vườn</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={occupancyData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={5}>
                          {occupancyData.map((_, index) => <Cell key={`cell-${index}`} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} ô`, 'Số lượng']} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 lg:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900 text-base">Doanh thu theo ngày ({metrics.locationName})</h3>
                    </div>
                    {revenueData?.dailyBreakdown && revenueData.dailyBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={revenueData.dailyBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
                        <DollarSign className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-xs">Chưa phát sinh doanh thu ngày tại cơ sở này</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 💥 2 BẢNG DỮ LIỆU CỦA CƠ SỞ: Lượt thuê & Cảnh báo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bảng Lượt thuê */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-800 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" /> Khách đang thuê ({metrics.activeRentalsList?.length || 0})
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {metrics.activeRentalsList && metrics.activeRentalsList.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {metrics.activeRentalsList.map((rental) => (
                              <tr key={rental.rentalId} className="hover:bg-gray-50">
                                <td className="p-3 font-bold text-gray-900">#{rental.rentalId}</td>
                                <td className="p-3">
                                  <div className="font-bold text-gray-800">{rental.fullName}</div>
                                  <div className="text-[11px] text-gray-400">@{rental.username}</div>
                                </td>
                                <td className="p-3">
                                  <span className="bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200/50">Ô: {rental.slotNumber}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{rental.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center text-gray-400 text-xs">Không có lượt thuê đang hoạt động</div>
                      )}
                    </div>
                  </div>

                  {/* Bảng Cảnh báo */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-800 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> Cảnh báo IoT gần đây ({metrics.recentAlerts?.length || 0})
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {metrics.recentAlerts && metrics.recentAlerts.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <tbody className="divide-y divide-gray-100">
                            {metrics.recentAlerts.map((alert) => (
                              <tr key={alert.id} className="hover:bg-gray-50">
                                <td className="p-3 font-bold text-gray-400">#{alert.id}</td>
                                <td className="p-3">
                                  <div className="font-bold text-amber-600">{alert.description || alert.alertType}</div>
                                  <div className="text-[11px] text-gray-500">Cây: {alert.treeName} (Ô: {alert.slotNumber})</div>
                                </td>
                                <td className="p-3 font-mono">
                                  <div className="text-gray-400">Ngưỡng: {alert.thresholdValue}</div>
                                  <div className="text-red-600 font-bold">Thực tế: {alert.actualValue}</div>
                                </td>
                                <td className="p-3 text-right">
                                  <span className={clsx('px-2 py-0.5 rounded-full font-bold text-[10px]', alert.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                                    {alert.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center text-gray-400 text-xs">Không có cảnh báo gần đây</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

          </div>

          {/* 3. Quick Actions */}
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