import { useState, useEffect } from 'react';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Thermometer, Droplets, Sun, Activity, CheckCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import { iotApi } from '../../api/iotApi';
import type { SensorTypeInfo } from '../../types/api';

const customerNav = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

const staffNav = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
];

const SENSOR_ICONS: Record<string, JSX.Element> = {
  SOIL_MOISTURE: <Droplets className="w-5 h-5" />,
  PH: <Activity className="w-5 h-5" />,
  TEMPERATURE: <Thermometer className="w-5 h-5" />,
  HUMIDITY: <Droplets className="w-5 h-5" />,
  LIGHT_INTENSITY: <Sun className="w-5 h-5" />,
};

const CHART_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#ca8a04', '#9333ea', '#0d9488'];

export default function IoTMonitoringPage() {
  const isStaffView = window.location.pathname.includes('garden-staff');
  const navItems = isStaffView ? staffNav : customerNav;

  const [activeRentals, setActiveRentals] = useState<BookingHistory[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorTypeInfo[]>([]);
  const [deviceId] = useState('arduino-greenhouse-01');
  const [latestData, setLatestData] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!isStaffView) {
      bookingApi.getHistory()
        .then(list => setActiveRentals(list.filter(r => r.status === 'ACTIVE')))
        .catch(() => setActiveRentals([]));
    }
    iotApi.getTypes().then(setSensorTypes).catch(() => setSensorTypes([]));
  }, [isStaffView]);

  useEffect(() => {
    const fetchIoT = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const latest = await iotApi.getLatest(deviceId);
        const history = await iotApi.getHistory(deviceId, undefined, 100);
        setAccessDenied(false);

        const latestMap: Record<string, number> = {};
        latest.forEach(r => { latestMap[r.sensorType] = r.value; });
        setLatestData(latestMap);

        const timeMap: Record<string, Record<string, unknown>> = {};
        history.forEach(r => {
          const time = new Date(r.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          if (!timeMap[time]) timeMap[time] = { time, timestamp: new Date(r.recordedAt).getTime() };
          timeMap[time][r.sensorType] = r.value;
        });
        setChartData(Object.values(timeMap).sort((a, b) => (a.timestamp as number) - (b.timestamp as number)).slice(-20));
      } catch {
        setAccessDenied(!isStaffView);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchIoT(false);
    const interval = setInterval(() => fetchIoT(true), 5000);
    return () => clearInterval(interval);
  }, [deviceId, isStaffView]);

  if (!isStaffView && activeRentals.length === 0 && !loading) {
    return (
      <DashboardLayout navItems={navItems} title="Giám sát IoT">
        <div className="card text-center py-20">
          <Wifi className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold mb-2">Chưa có ô vườn đang thuê</h3>
          <p className="text-gray-500">Thuê ô vườn để theo dõi cảm biến (yêu cầu quyền staff trên BE hiện tại)</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Giám sát IoT">
      {accessDenied && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800">
          Customer chưa có quyền API IoT trên backend. Chỉ Garden Staff / Manager mới xem được dữ liệu cảm biến.
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-green-600 mb-6">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        Device: {deviceId}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {sensorTypes.map(st => {
          const val = latestData[st.name];
          return (
            <div key={st.name} className="card p-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 text-green-600">
                {SENSOR_ICONS[st.name] || <Activity className="w-6 h-6" />}
              </div>
              <div className="text-xl font-black">{val != null ? `${val} ${st.unit}` : '--'}</div>
              <div className="text-xs text-gray-500">{st.description}</div>
            </div>
          );
        })}
      </div>

      {/* Cập nhật hiển thị thành nhiều LineChart riêng biệt */}
      {chartData.length > 0 && sensorTypes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {sensorTypes.map((st, index) => (
            <div key={st.name} className="card p-4">
              <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                <div style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                  {SENSOR_ICONS[st.name] || <Activity className="w-5 h-5" />}
                </div>
                <span>{st.description || st.name} ({st.unit})</span>
              </div>
              
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickMargin={8} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={st.name} 
                    name={st.description || st.name} 
                    stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {!loading && sensorTypes.length === 0 && (
        <div className="card text-center py-8 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          Chưa có dữ liệu cảm biến
        </div>
      )}
    </DashboardLayout>
  );
}