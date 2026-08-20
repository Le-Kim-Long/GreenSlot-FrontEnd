import { useState, useEffect, useMemo } from 'react';
import { Wifi, TrendingUp, Thermometer, Droplets, Sun, Activity, CheckCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import { iotApi } from '../../api/iotApi';
import type { SensorTypeInfo } from '../../types/api';
import { customerNavItems as customerNav } from './customerNavItems';

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

interface PillarOption {
  pillarId?: number;
  pillarCode: string;
  pillarType?: string;
  capacityHoles?: number;
  slotNumber?: string;
  rentalId?: number;
  treeName?: string;
}

export default function IoTMonitoringPage() {
  const isStaffView = window.location.pathname.includes('garden-staff');
  const navItems = isStaffView ? staffNav : customerNav;

  const [activeRentals, setActiveRentals] = useState<BookingHistory[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorTypeInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('arduino-greenhouse-01');
  const [latestData, setLatestData] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [accessDenied, setAccessDenied] = useState(false);

  // Tải danh sách hợp đồng đang thuê & loại cảm biến
  useEffect(() => {
    if (!isStaffView) {
      bookingApi.getHistory()
        .then(list => {
          const active = (list || []).filter(r => r.status === 'ACTIVE');
          setActiveRentals(active);
        })
        .catch(() => setActiveRentals([]));
    }
    iotApi.getTypes().then(setSensorTypes).catch(() => setSensorTypes([]));
  }, [isStaffView]);

  // Trích xuất danh sách tất cả các trụ mà khách hàng đang sở hữu
  const availablePillars = useMemo<PillarOption[]>(() => {
    const list: PillarOption[] = [];
    activeRentals.forEach(rental => {
      if (rental.pillars && rental.pillars.length > 0) {
        rental.pillars.forEach(p => {
          list.push({
            pillarId: p.id,
            pillarCode: p.pillarCode,
            pillarType: p.pillarType,
            capacityHoles: p.capacityHoles,
            slotNumber: rental.slotNumber,
            rentalId: rental.id,
            treeName: rental.treeName,
          });
        });
      } else if (rental.pillarCodes && rental.pillarCodes.length > 0) {
        rental.pillarCodes.forEach(code => {
          list.push({
            pillarCode: code,
            slotNumber: rental.slotNumber,
            rentalId: rental.id,
            treeName: rental.treeName,
          });
        });
      }
    });
    return list;
  }, [activeRentals]);

  // Tìm thông tin trụ đang được chọn
  const currentPillarInfo = useMemo(() => {
    return availablePillars.find(p => p.pillarCode === selectedDeviceId);
  }, [availablePillars, selectedDeviceId]);

  // Tải dữ liệu cảm biến (Latest & History)
  const fetchIoT = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [latest, history] = await Promise.all([
        iotApi.getLatest(selectedDeviceId).catch(() => []),
        iotApi.getHistory(selectedDeviceId, undefined, 100).catch(() => []),
      ]);
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
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    } catch {
      setAccessDenied(!isStaffView);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIoT(false);
    const interval = setInterval(() => fetchIoT(true), 5000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, isStaffView]);

  if (!isStaffView && activeRentals.length === 0 && !loading) {
    return (
      <DashboardLayout navItems={navItems} title="Giám sát IoT">
        <div className="card text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <Wifi className="w-20 h-20 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold mb-2 text-gray-800">Chưa có ô vườn đang thuê</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Bạn cần có ít nhất một hợp đồng thuê ô vườn đang hoạt động để theo dõi số liệu cảm biến trực tiếp từ các trụ canh tác.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Giám sát IoT">
      {accessDenied && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-sm text-yellow-800 flex items-center gap-2">
          Customer chưa có quyền API IoT trên backend. Chỉ Garden Staff / Manager mới xem được dữ liệu cảm biến.
        </div>
      )}

      {/* THANH ĐIỀU KHIỂN & CHỌN TRỤ CANH TÁC (DROPDOWN & QUICK SELECTOR) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bảng Điều Khiển Cảm Biến</h2>
            <p className="text-xs text-gray-500">
              Chọn trụ cụ thể hoặc xem thông số cảm biến tổng thể của nhà vườn
            </p>
          </div>
        </div>

        {/* BỘ CHỌN DROPDOWN THEO TỪNG TRỤ HOẶC TẤT CẢ */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[280px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Thiết bị / Trụ giám sát:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition cursor-pointer"
            >
              <option value="arduino-greenhouse-01">🌐 Tất cả các trụ (Tổng thể khu vườn)</option>
              {availablePillars.map((p) => (
                <option key={p.pillarCode} value={p.pillarCode}>
                  🌱 Trụ {p.pillarCode} - Ô {p.slotNumber} ({p.capacityHoles || 24} hốc)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchIoT(false)}
            disabled={loading}
            title="Làm mới dữ liệu ngay"
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition mt-5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* THANH THÔNG TIN TRẠNG THÁI HIỆN TẠI (STATUS PILLS) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-green-50/60 border border-green-200/60 px-4 py-3 rounded-2xl text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-green-900">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span>Đang theo dõi:</span>
            <span className="bg-green-200/80 text-green-900 px-2 py-0.5 rounded-md font-mono">
              {currentPillarInfo ? `Trụ ${currentPillarInfo.pillarCode} (Ô ${currentPillarInfo.slotNumber})` : 'Toàn bộ nhà vườn'}
            </span>
          </div>
          {currentPillarInfo?.treeName && (
            <div className="hidden sm:inline-block text-green-800">
              Giống cây: <strong>{currentPillarInfo.treeName}</strong>
            </div>
          )}
        </div>

        <div className="text-gray-500 flex items-center gap-2 font-mono">
          <span>Cập nhật lúc: {lastUpdated || 'Đang đồng bộ...'}</span>
        </div>
      </div>

      {/* NÚT CHUYỂN NHANH TỪNG TRỤ (QUICK PILLS) NẾU CÓ NHIỀU TRỤ */}
      {availablePillars.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          <button
            onClick={() => setSelectedDeviceId('arduino-greenhouse-01')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
              selectedDeviceId === 'arduino-greenhouse-01'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>
          {availablePillars.map((p) => (
            <button
              key={p.pillarCode}
              onClick={() => setSelectedDeviceId(p.pillarCode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                selectedDeviceId === p.pillarCode
                  ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
              }`}
            >
              <span>Trụ {p.pillarCode}</span>
              <span className="text-[10px] opacity-75 font-normal">({p.slotNumber})</span>
            </button>
          ))}
        </div>
      )}

      {/* THẺ SỐ LIỆU TỨC THỜI (REALTIME GAUGES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {sensorTypes.map(st => {
          const val = latestData[st.name];
          return (
            <div key={st.name} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 text-green-600">
                {SENSOR_ICONS[st.name] || <Activity className="w-6 h-6" />}
              </div>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {val != null ? `${val} ${st.unit}` : '--'}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{st.description || st.name}</div>
            </div>
          );
        })}
      </div>

      {/* BIỂU ĐỒ DIỄN BIẾN THEO THỜI GIAN (LINE CHARTS) */}
      {chartData.length > 0 && sensorTypes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {sensorTypes.map((st, index) => (
            <div key={st.name} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold text-sm">
                <div style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                  {SENSOR_ICONS[st.name] || <Activity className="w-5 h-5" />}
                </div>
                <span>{st.description || st.name} ({st.unit})</span>
              </div>
              
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} tickMargin={8} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={st.name} 
                    name={st.description || st.name} 
                    stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {!loading && sensorTypes.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center py-12 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-green-600" />
          <p className="font-medium text-gray-600">Chưa có loại cảm biến nào được cấu hình</p>
        </div>
      )}
    </DashboardLayout>
  );
}