import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, AlertOctagon, Calendar, Radio, Repeat, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { alertApi, AlertAnalyticsDTO } from '../../api/alertApi';
import { managerApi } from '../../api/managerApi';
import { useAuth } from '../../context/AuthContext';
import { staffNavItems } from './staffNav';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#d97706', '#0891b2', '#0d9488', '#e11d48'];

// Trang thống kê cảnh báo IoT (dành cho manager/location_manager): số liệu tổng quan
// + biểu đồ theo khoảng thời gian tùy chọn, lấy từ GET /analytics/alerts
export default function AlertAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AlertAnalyticsDTO | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mặc định xem thống kê từ đầu tháng hiện tại đến hôm nay
  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

  // Load danh sách cơ sở nếu là manager tổng
  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      managerApi.getLocations().then((res: any) => {
        setLocations(res || []);
      }).catch(() => {});
    }
  }, [user]);

  // Gọi API lấy số liệu thống kê theo khoảng ngày đang chọn (endDate lấy hết 23:59:59 để bao trọn cả ngày)
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const locId = selectedLocationId ? parseInt(selectedLocationId, 10) : undefined;
      const result = await alertApi.getAlertAnalytics(
        new Date(`${startDate}T00:00:00`).toISOString(),
        new Date(`${endDate}T23:59:59`).toISOString(),
        locId
      );
      setData(result);
    } catch (err) {
      console.error('Lỗi tải dữ liệu thống kê cảnh báo:', err);
      setError('Không thể tải dữ liệu thống kê cảnh báo từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại mỗi khi người dùng đổi khoảng ngày hoặc đổi cơ sở
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedLocationId]);

  // Backend trả về dạng map { loại: số lượng } — chuyển sang mảng để recharts vẽ được
  const alertsByTypeData = data
    ? Object.entries(data.alertsByType || {}).map(([type, count]) => ({ type, count }))
    : [];

  const alertsBySensorTypeData = data
    ? Object.entries(data.alertsBySensorType || {}).map(([sensorType, count]) => ({ sensorType, count }))
    : [];

  return (
    <DashboardLayout navItems={staffNavItems} title="Thống kê Cảnh báo">
      {/* Bộ lọc ngày tháng và cơ sở */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">Thời gian:</span>
            <input
              type="date"
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-400 font-bold">—</span>
            <input
              type="date"
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {(user?.role === 'manager' || user?.role === 'admin') && locations.length > 0 && (
            <div className="flex items-center gap-2 ml-0 sm:ml-4 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0">
              <MapPin className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-700">Cơ sở:</span>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white"
              >
                <option value="">Tất cả cơ sở</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.locationName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang tổng hợp số liệu cảnh báo...</p>
        </div>
      ) : data ? (
        <>
          {/* Thẻ Thống Kê Tổng Quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng cảnh báo</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{data.totalAlerts || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đang chờ xử lý</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{data.pendingAlerts || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đã xử lý</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{data.resolvedAlerts || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nghiêm trọng</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{data.criticalAlerts || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Khu Vực Biểu Đồ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Cảnh báo theo loại</h3>
              {alertsByTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={alertsByTypeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      formatter={(v: number) => [v, 'Số lượng']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Chưa có cảnh báo theo loại</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 text-lg">Theo loại cảm biến</h3>
              </div>
              {alertsBySensorTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={alertsBySensorTypeData}
                      dataKey="count"
                      nameKey="sensorType"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {alertsBySensorTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [v, 'Số lượng']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs font-semibold text-gray-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <Radio className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm text-center">Chưa có dữ liệu cảm biến</p>
                </div>
              )}
            </div>
          </div>

          {/* Chỉ số bổ sung */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Repeat className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại phổ biến nhất</div>
                  <div className="text-lg font-black text-gray-900 mt-0.5">{data.mostCommonAlertType || 'N/A'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{data.mostCommonAlertFrequency || 0} lần</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sm:col-span-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian xử lý trung bình</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">
                    {data.averageResolutionTimeMinutes || 0} phút
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
