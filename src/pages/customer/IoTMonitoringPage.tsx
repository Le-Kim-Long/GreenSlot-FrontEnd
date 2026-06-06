import { useState } from 'react';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Thermometer, Droplets, Sun, Wind, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockRentals, generateIoTHistory, mockIoTAlerts } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

export default function IoTMonitoringPage() {
  const { user } = useAuth();
  const activeRentals = mockRentals.filter(r => r.customerId === user?.id && r.status === 'active' && r.iotEnabled);
  const [selectedGarden, setSelectedGarden] = useState(activeRentals[0]?.gardenId || '');
  const [chartMetric, setChartMetric] = useState<'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity'>('temperature');

  const iotData = generateIoTHistory(selectedGarden);
  const latest = iotData[iotData.length - 1];
  const alerts = mockIoTAlerts.filter(a => a.gardenId === selectedGarden);

  const metrics = [
    {
      key: 'temperature', label: 'Nhiệt độ', value: latest ? `${latest.temperature.toFixed(1)}°C` : '--',
      icon: <Thermometer className="w-6 h-6" />, color: 'text-red-500', bg: 'bg-red-50',
      status: latest && latest.temperature > 30 ? 'warning' : 'ok',
      range: '18-30°C',
    },
    {
      key: 'humidity', label: 'Độ ẩm KK', value: latest ? `${latest.humidity.toFixed(0)}%` : '--',
      icon: <Droplets className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-50',
      status: latest && (latest.humidity < 50 || latest.humidity > 80) ? 'warning' : 'ok',
      range: '50-80%',
    },
    {
      key: 'lightIntensity', label: 'Ánh sáng', value: latest ? `${latest.lightIntensity.toFixed(0)} lux` : '--',
      icon: <Sun className="w-6 h-6" />, color: 'text-yellow-500', bg: 'bg-yellow-50',
      status: 'ok',
      range: '500-1500 lux',
    },
    {
      key: 'soilMoisture', label: 'Độ ẩm đất', value: latest ? `${latest.soilMoisture.toFixed(0)}%` : '--',
      icon: <Wind className="w-6 h-6" />, color: 'text-green-500', bg: 'bg-green-50',
      status: latest && latest.soilMoisture < 40 ? 'warning' : 'ok',
      range: '40-70%',
    },
    {
      key: 'waterLevel', label: 'Mực nước', value: latest ? `${latest.waterLevel.toFixed(0)}%` : '--',
      icon: <Activity className="w-6 h-6" />, color: 'text-cyan-500', bg: 'bg-cyan-50',
      status: latest && latest.waterLevel < 30 ? 'warning' : 'ok',
      range: '>30%',
    },
    {
      key: 'co2Level', label: 'CO₂', value: latest ? `${latest.co2Level.toFixed(0)} ppm` : '--',
      icon: <Wind className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-50',
      status: latest && latest.co2Level > 600 ? 'warning' : 'ok',
      range: '300-600 ppm',
    },
  ];

  const chartData = iotData.slice(-12).map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    temperature: parseFloat(d.temperature.toFixed(1)),
    humidity: parseFloat(d.humidity.toFixed(1)),
    soilMoisture: parseFloat(d.soilMoisture.toFixed(1)),
    lightIntensity: parseFloat((d.lightIntensity / 10).toFixed(1)),
  }));

  const chartColors: Record<string, string> = {
    temperature: '#ef4444',
    humidity: '#3b82f6',
    soilMoisture: '#22c55e',
    lightIntensity: '#f59e0b',
  };

  const chartLabels: Record<string, string> = {
    temperature: 'Nhiệt độ (°C)',
    humidity: 'Độ ẩm KK (%)',
    soilMoisture: 'Độ ẩm đất (%)',
    lightIntensity: 'Ánh sáng (×10 lux)',
  };

  if (activeRentals.length === 0) {
    return (
      <DashboardLayout navItems={navItems} title="Giám sát IoT">
        <div className="card text-center py-20">
          <Wifi className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có vườn IoT</h3>
          <p className="text-gray-500 mb-6">Bạn cần thuê vườn có tích hợp IoT để sử dụng tính năng này</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Giám sát IoT">
      {/* Garden selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select className="input max-w-xs" value={selectedGarden} onChange={e => setSelectedGarden(e.target.value)}>
          {activeRentals.map(r => (
            <option key={r.gardenId} value={r.gardenId}>{r.gardenName}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Đang cập nhật theo thời gian thực
        </div>
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {metrics.map(m => (
          <div key={m.key} className={clsx('card p-4 relative', m.status === 'warning' ? 'border-orange-200 bg-orange-50' : '')}>
            {m.status === 'warning' && <AlertTriangle className="w-3 h-3 text-orange-500 absolute top-3 right-3" />}
            {m.status === 'ok' && <CheckCircle className="w-3 h-3 text-green-500 absolute top-3 right-3" />}
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', m.bg)}>
              <div className={m.color}>{m.icon}</div>
            </div>
            <div className="text-xl font-black text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
            <div className="text-xs text-gray-400 mt-1">{m.range}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Biểu đồ theo thời gian (12h gần nhất)</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(chartLabels) as (keyof typeof chartLabels)[]).map(k => (
              <button key={k} onClick={() => setChartMetric(k as typeof chartMetric)}
                className={clsx('text-xs px-3 py-1.5 rounded-full border transition-all', chartMetric === k ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400')}>
                {chartLabels[k]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[chartMetric]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColors[chartMetric]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`${v}`, chartLabels[chartMetric]]} />
            <Area type="monotone" dataKey={chartMetric} stroke={chartColors[chartMetric]} strokeWidth={2} fill="url(#colorMetric)" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Lịch sử cảnh báo</h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p>Không có cảnh báo nào cho vườn này</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className={clsx('flex items-start justify-between gap-3 p-4 rounded-xl',
                a.resolved ? 'bg-gray-50' : a.severity === 'high' ? 'bg-red-50' : a.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50')}>
                <div className="flex items-start gap-3">
                  {a.resolved
                    ? <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', a.severity === 'high' ? 'text-red-500' : a.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500')} />
                  }
                  <div>
                    <div className={clsx('text-sm font-medium', a.resolved ? 'text-gray-500' : 'text-gray-900')}>{a.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(a.timestamp).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {a.resolved
                    ? <span className="badge-gray text-xs">Đã xử lý</span>
                    : <span className={a.severity === 'high' ? 'badge-red' : a.severity === 'medium' ? 'badge-yellow' : 'badge-blue'}>{a.severity === 'high' ? 'Nghiêm trọng' : a.severity === 'medium' ? 'Cảnh báo' : 'Thông báo'}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
