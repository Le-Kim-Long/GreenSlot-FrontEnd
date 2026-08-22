import { useState, useEffect, useMemo } from 'react';
import { Wifi, TrendingUp, Thermometer, Droplets, Sun, Activity, CheckCircle, RefreshCw, Cpu, ArrowLeft, Eye } from 'lucide-react';
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
  const [allPillarsData, setAllPillarsData] = useState<Record<string, Record<string, number>>>({});
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

  // Trích xuất danh sách duy nhất các trụ (Loại bỏ trùng lặp và loại bỏ gateway tổng)
  const availablePillars = useMemo<PillarOption[]>(() => {
    const map = new Map<string, PillarOption>();
    activeRentals.forEach(rental => {
      if (rental.pillars && rental.pillars.length > 0) {
        rental.pillars.forEach(p => {
          const code = p.pillarCode?.trim();
          if (code && code !== 'arduino-greenhouse-01' && !map.has(code)) {
            map.set(code, {
              pillarId: p.id,
              pillarCode: code,
              pillarType: p.pillarType,
              capacityHoles: p.capacityHoles,
              slotNumber: rental.slotNumber,
              rentalId: rental.id,
              treeName: rental.treeName,
            });
          }
        });
      } else if (rental.pillarCodes && rental.pillarCodes.length > 0) {
        rental.pillarCodes.forEach(code => {
          const cleanCode = code?.trim();
          if (cleanCode && cleanCode !== 'arduino-greenhouse-01' && !map.has(cleanCode)) {
            map.set(cleanCode, {
              pillarCode: cleanCode,
              slotNumber: rental.slotNumber,
              rentalId: rental.id,
              treeName: rental.treeName,
            });
          }
        });
      }
    });
    return Array.from(map.values());
  }, [activeRentals]);

  // Tìm thông tin trụ đang được chọn
  const currentPillarInfo = useMemo(() => {
    return availablePillars.find(p => p.pillarCode === selectedDeviceId);
  }, [availablePillars, selectedDeviceId]);

  const isAllView = selectedDeviceId === 'arduino-greenhouse-01';

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

      // Khi chọn "Tất cả các trụ", tải đồng thời số liệu tức thời của từng trụ riêng lẻ
      if (isAllView && availablePillars.length > 0) {
        const pillarResults = await Promise.all(
          availablePillars.map(p =>
            iotApi.getLatest(p.pillarCode)
              .then(readings => ({ pillarCode: p.pillarCode, readings }))
              .catch(() => ({ pillarCode: p.pillarCode, readings: [] }))
          )
        );
        const mapAll: Record<string, Record<string, number>> = {};
        pillarResults.forEach(res => {
          const map: Record<string, number> = {};
          res.readings.forEach(r => { map[r.sensorType] = r.value; });
          mapAll[res.pillarCode] = map;
        });
        setAllPillarsData(mapAll);
      }

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
  }, [selectedDeviceId, isStaffView, availablePillars.length]);

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
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bảng Điều Khiển Cảm Biến</h2>
            <p className="text-xs text-gray-500">
              Chọn từng trụ để xem chi tiết hoặc xem bảng tổng hợp toàn bộ các trụ đã thuê ({availablePillars.length} trụ)
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
              <option value="arduino-greenhouse-01">🌐 Tất cả các trụ (Bảng tổng hợp)</option>
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
            <span className="bg-green-200/80 text-green-900 px-2.5 py-0.5 rounded-md font-mono font-bold">
              {currentPillarInfo ? `Trụ ${currentPillarInfo.pillarCode} (Ô ${currentPillarInfo.slotNumber})` : `Tất cả các trụ (${availablePillars.length} trụ)`}
            </span>
          </div>
          {currentPillarInfo?.treeName && (
            <div className="hidden sm:inline-block text-green-800">
              Giống cây: <strong>{currentPillarInfo.treeName}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isAllView && (
            <button
              onClick={() => setSelectedDeviceId('arduino-greenhouse-01')}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem bảng tất cả các trụ</span>
            </button>
          )}
          <div className="text-gray-500 flex items-center gap-2 font-mono">
            <span>Cập nhật lúc: {lastUpdated || 'Đang đồng bộ...'}</span>
          </div>
        </div>
      </div>

      {/* 💥 BẢNG TỔNG HỢP SỐ LIỆU CỦA TỪNG TRỤ (HIỂN THỊ KHI CHỌN "TẤT CẢ") */}
      {isAllView && availablePillars.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Bảng Tổng Hợp Chỉ Số Cảm Biến Từng Trụ Canh Tác
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi tức thời toàn bộ các thông số môi trường của từng trụ bạn đang thuê
              </p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full border border-green-200">
              {availablePillars.length} Trụ Đang Hoạt Động
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-100">
                <tr>
                  <th className="p-3.5">Mã Trụ & Loại Trụ</th>
                  <th className="p-3.5">Ô Vườn</th>
                  <th className="p-3.5">Giống Cây</th>
                  <th className="p-3.5">Độ Ẩm Đất</th>
                  <th className="p-3.5">Độ pH Đất</th>
                  <th className="p-3.5">Nhiệt Độ</th>
                  <th className="p-3.5">Ánh Sáng</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availablePillars.map((p) => {
                  const pData = allPillarsData[p.pillarCode] || latestData;
                  const soilMoisture = pData['SOIL_MOISTURE'];
                  const ph = pData['PH'];
                  const temp = pData['TEMPERATURE'];
                  const light = pData['LIGHT_INTENSITY'];

                  return (
                    <tr key={p.pillarCode} className="hover:bg-green-50/30 transition">
                      <td className="p-3.5 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Trụ {p.pillarCode}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-normal block pl-4">
                          {p.pillarType || 'Trụ'} ({p.capacityHoles || 24} hốc)
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-gray-700">
                        Ô {p.slotNumber}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {p.treeName || 'Đang canh tác'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {soilMoisture != null ? (
                          <span className={soilMoisture < 40 ? 'text-amber-600' : 'text-green-600'}>
                            {soilMoisture} %
                          </span>
                        ) : '--'}
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {ph != null ? `${ph} pH` : '--'}
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {temp != null ? `${temp} °C` : '--'}
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {light != null ? `${light} Lux` : '--'}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100/70 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-green-600" /> Online
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedDeviceId(p.pillarCode)}
                          className="px-3 py-1 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-xl transition border border-emerald-200 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Biểu đồ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* THẺ SỐ LIỆU TỨC THỜI & BIỂU ĐỒ DIỄN BIẾN (CHỈ HIỂN THỊ KHI XEM RIÊNG TỪNG TRỤ) */}
      {!isAllView && (
        <>
          {/* THẺ SỐ LIỆU TỨC THỜI (REALTIME GAUGES) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
            {sensorTypes.map(st => {
              const val = latestData[st.name];
              return (
                <div key={st.name} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 text-green-600">
                    {SENSOR_ICONS[st.name] || <Activity className="w-5 h-5" />}
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
        </>
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