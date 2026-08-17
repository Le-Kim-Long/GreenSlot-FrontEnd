import { useState, useEffect } from 'react';
import { 
  ClipboardList, Wifi, ShieldAlert, Calendar,
  Droplets, Power, RefreshCw, AlertCircle, CheckCircle2,
  Zap, Info, History
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { pumpApi, PumpStatusPayload } from '../../api/pumpApi';
import { useToast } from '../../context/ToastContext';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <Droplets className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> }
];

export default function PumpControl() {
  const toast = useToast();
  const [pumpData, setPumpData] = useState<PumpStatusPayload>({ status: 'OFF', autoMode: true });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPumpStatus = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      const data = await pumpApi.getPumpStatus();
      setPumpData(data);
    } catch (err) {
      console.error('Lỗi khi lấy trạng thái máy bơm:', err);
      setError('Không thể kết nối đến máy chủ IoT để lấy trạng thái máy bơm.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPumpStatus();
    // Tự động đồng bộ mỗi 5 giây
    const interval = setInterval(() => {
      fetchPumpStatus(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePump = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      const nextStatus = pumpData.status === 'ON' ? 'OFF' : 'ON';
      const res = await pumpApi.updatePumpStatus({ status: nextStatus });
      setPumpData(res);
      if (nextStatus === 'ON') {
        toast.success('Đã kích hoạt máy bơm xịt nước (Tự ngắt sau 5s bảo vệ rơ-le)');
      } else {
        toast.info('Đã tắt máy bơm xịt nước');
      }
    } catch (err) {
      console.error('Lỗi điều khiển máy bơm:', err);
      toast.error('Lỗi khi gửi lệnh điều khiển máy bơm');
      setError('Không thể gửi lệnh điều khiển đến thiết bị.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAutoMode = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      const nextAutoMode = !pumpData.autoMode;
      const res = await pumpApi.setAutoMode(nextAutoMode);
      setPumpData(res);
      if (nextAutoMode) {
        toast.success('Đã bật chế độ tự động tưới nước khi độ ẩm đất thấp');
      } else {
        toast.warning('Đã chuyển sang chế độ điều khiển thủ công hoàn toàn');
      }
    } catch (err) {
      console.error('Lỗi cập nhật chế độ tự động:', err);
      toast.error('Không thể cập nhật chế độ tự động tưới');
    } finally {
      setIsUpdating(false);
    }
  };

  const isPumpOn = pumpData.status === 'ON';

  return (
    <DashboardLayout navItems={navItems} title="Hệ thống Tưới & Máy Bơm Thông Minh">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Droplets className="w-6 h-6" />
              </span>
              Bảng Điều Khiển Tưới Nước & Phun Sương
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý máy bơm xịt nước tự động theo chỉ số cảm biến độ ẩm đất và ánh sáng.
            </p>
          </div>
          <button
            onClick={() => fetchPumpStatus()}
            disabled={isLoading || isUpdating}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main interactive grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Status & Quick Action Card */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-sm font-medium text-gray-500">Trạng thái rơ-le máy bơm</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isPumpOn ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPumpOn ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {isPumpOn ? 'ĐANG HOẠT ĐỘNG (ON)' : 'ĐANG TẮT (OFF)'}
                </span>
              </div>

              {/* Visual pump animation */}
              <div className="my-8 flex flex-col items-center justify-center">
                <div className={`relative flex items-center justify-center w-36 h-36 rounded-full transition-all duration-500 ${
                  isPumpOn 
                    ? 'bg-emerald-50 border-4 border-emerald-400 shadow-lg shadow-emerald-100' 
                    : 'bg-gray-50 border-4 border-gray-200'
                }`}>
                  {isPumpOn && (
                    <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping" />
                  )}
                  <Droplets className={`w-16 h-16 transition-colors duration-300 ${
                    isPumpOn ? 'text-emerald-500 animate-bounce' : 'text-gray-400'
                  }`} />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {isPumpOn ? 'Máy bơm đang phun sương / tưới nước' : 'Hệ thống đang ở chế độ chờ'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pumpData.lastTriggerReason || 'Chưa có nhật ký gần đây'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleTogglePump}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${
                  isPumpOn
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                <Power className="w-5 h-5" />
                {isUpdating ? 'Đang gửi lệnh...' : isPumpOn ? 'Tắt Máy Bơm Ngay' : 'Kích Hoạt Bơm Thủ Công (5 giây)'}
              </button>
            </div>
          </div>

          {/* Auto Mode & Automation Rules */}
          <div className="md:col-span-5 space-y-6">
            {/* Auto Mode Control Box */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tự Động Tưới Thông Minh</h3>
                    <p className="text-xs text-gray-500">Auto-Irrigation Trigger</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAutoMode}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pumpData.autoMode ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      pumpData.autoMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Trạng thái chế độ:</span>
                  <span className={`font-semibold ${pumpData.autoMode ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {pumpData.autoMode ? 'ĐANG BẬT TỰ ĐỘNG' : 'ĐÃ TẮT (THỦ CÔNG)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Thời gian tưới mỗi chu kỳ:</span>
                  <span className="font-medium text-gray-800">5.0 giây (ESP32)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Khoảng cách an toàn (Cooldown):</span>
                  <span className="font-medium text-gray-800">60 giây</span>
                </div>
              </div>
            </div>

            {/* Rule details info card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/70 p-5">
              <h4 className="font-semibold text-emerald-950 flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-emerald-600" />
                Cơ chế kích hoạt tưới tự động
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-emerald-800 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Độ ẩm đất thấp:</strong> Khi cảm biến đo được độ ẩm đất (%) &lt; Ngưỡng tối thiểu của cây trồng, Backend tự động kích hoạt lệnh bật bơm.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tự ngắt an toàn:</strong> ESP32 tự động ngắt relay sau đúng 5 giây phun sương và chuyển trạng thái về OFF.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Thông báo đa kênh:</strong> Khách hàng thuê ô đất và nhân viên vườn đều nhận được thông báo về việc hệ thống vừa tự động tưới nước.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}