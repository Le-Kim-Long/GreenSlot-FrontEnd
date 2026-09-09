import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, Wifi, ShieldAlert, Calendar,
  Droplets, Power, RefreshCw, AlertCircle, AlertTriangle,
  Zap, Info, History, Camera, Layers, Sprout, Clock, ShieldCheck, Filter
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { pumpApi, AssignedSlotPumps } from '../../api/pumpApi';
import { useToast } from '../../context/ToastContext';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <Droplets className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> }
];

export default function PumpControl() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const targetSlotId = searchParams.get('slotId');
  const targetPillarCode = searchParams.get('pillarCode');

  const [assignedSlots, setAssignedSlots] = useState<AssignedSlotPumps[]>([]);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const setBusy = (key: string, isBusy: boolean) => {
    setActionLoading(prev => ({ ...prev, [key]: isBusy }));
  };

  const fetchAssignedPumps = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);
      const slots = await pumpApi.getMyAssignedPumps();
      setAssignedSlots(slots || []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách máy bơm trụ:', err);
      if (!silent) {
        setError('Không thể kết nối đến máy chủ IoT để lấy danh sách máy bơm theo ô vườn.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedPumps();
    // Tự động đồng bộ mỗi 5 giây
    const interval = setInterval(() => {
      fetchAssignedPumps(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAssignedPumps]);

  // Tự động chọn ô vườn nếu có tham số slotId từ thông báo
  useEffect(() => {
    if (targetSlotId && assignedSlots.some(s => String(s.slotId) === String(targetSlotId))) {
      setSelectedSlotFilter(String(targetSlotId));
    }
  }, [targetSlotId, assignedSlots]);

  // Tự động cuộn tới trụ cần tưới nước nếu có tham số pillarCode từ thông báo
  useEffect(() => {
    if (targetPillarCode) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`pillar-card-${targetPillarCode.toUpperCase()}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetPillarCode, selectedSlotFilter]);

  // Điều khiển máy bơm cho 1 trụ cụ thể (ON = tự ngắt sau 5s)
  const handleTogglePillarPump = async (pillarId: number, currentStatus: string, pillarCode: string) => {
    const key = `pillar_${pillarId}`;
    try {
      setBusy(key, true);
      const nextStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
      await pumpApi.setPillarPumpStatus(pillarId, nextStatus);
      
      // Cập nhật optimistic state
      setAssignedSlots(prev => prev.map(slot => ({
        ...slot,
        pillars: slot.pillars.map(p => p.pillarId === pillarId ? {
          ...p,
          pumpStatus: nextStatus,
          lastTriggerReason: nextStatus === 'ON' ? 'Kích hoạt thủ công (5s)' : 'Tắt thủ công',
          lastTriggerTime: new Date().toISOString()
        } : p)
      })));

      if (nextStatus === 'ON') {
        toast.success(`Đã kích hoạt máy bơm trụ ${pillarCode} (Tự ngắt sau 5s bảo vệ rễ cây)`);
      } else {
        toast.info(`Đã tắt máy bơm trụ ${pillarCode}`);
      }
    } catch (err) {
      console.error(`Lỗi điều khiển máy bơm trụ ${pillarId}:`, err);
      toast.error(`Không thể điều khiển máy bơm trụ ${pillarCode}`);
    } finally {
      setBusy(key, false);
    }
  };

  // Bật/Tắt chế độ tự động cho 1 trụ
  const handleTogglePillarAutoMode = async (pillarId: number, currentAutoMode: boolean | undefined, pillarCode: string) => {
    const key = `auto_${pillarId}`;
    const nextMode = !currentAutoMode;
    try {
      setBusy(key, true);
      await pumpApi.setPillarAutoMode(pillarId, nextMode);

      setAssignedSlots(prev => prev.map(slot => ({
        ...slot,
        pillars: slot.pillars.map(p => p.pillarId === pillarId ? { ...p, autoMode: nextMode } : p)
      })));

      if (nextMode) {
        toast.success(`Đã bật chế độ tự động tưới cho trụ ${pillarCode}`);
      } else {
        toast.warning(`Đã chuyển trụ ${pillarCode} sang chế độ điều khiển thủ công`);
      }
    } catch (err) {
      console.error(`Lỗi đổi chế độ tự động trụ ${pillarId}:`, err);
      toast.error(`Không thể cập nhật chế độ tự động cho trụ ${pillarCode}`);
    } finally {
      setBusy(key, false);
    }
  };

  // Kích hoạt tưới toàn bộ trụ trong 1 ô vườn (5s)
  const handleTriggerAllInSlot = async (slotId: number, slotNumber: string, count: number) => {
    const key = `slot_${slotId}`;
    try {
      setBusy(key, true);
      const res = await pumpApi.triggerSlotAllPumps(slotId);
      toast.success(res.message || `Đã kích hoạt tưới 5s cho ${count} trụ trong ô ${slotNumber}`);
      
      // Fetch lại dữ liệu
      await fetchAssignedPumps(true);
    } catch (err) {
      console.error(`Lỗi kích hoạt toàn bộ ô ${slotId}:`, err);
      toast.error(`Không thể kích hoạt tưới cho toàn bộ ô ${slotNumber}`);
    } finally {
      setBusy(key, false);
    }
  };

  // Tắt toàn bộ máy bơm trong 1 ô vườn
  const handleTurnOffAllInSlot = async (slotId: number, slotNumber: string) => {
    const key = `slot_off_${slotId}`;
    try {
      setBusy(key, true);
      const res = await pumpApi.turnOffSlotAllPumps(slotId);
      toast.info(res.message || `Đã tắt toàn bộ máy bơm trong ô ${slotNumber}`);
      await fetchAssignedPumps(true);
    } catch (err) {
      console.error(`Lỗi tắt toàn bộ ô ${slotId}:`, err);
      toast.error(`Không thể tắt toàn bộ máy bơm trong ô ${slotNumber}`);
    } finally {
      setBusy(key, false);
    }
  };

  // Lọc ô vườn hiển thị theo dropdown
  const displayedSlots = selectedSlotFilter === 'all'
    ? assignedSlots
    : assignedSlots.filter(s => String(s.slotId) === selectedSlotFilter);

  // Tính các thống kê tổng quan theo phạm vi hiển thị (tất cả hoặc 1 ô cụ thể)
  const totalSlots = displayedSlots.length;
  const totalPillars = displayedSlots.reduce((acc, slot) => acc + (slot.pillars?.length || 0), 0);
  const runningPillars = displayedSlots.reduce(
    (acc, slot) => acc + (slot.pillars?.filter(p => p.pumpStatus === 'ON').length || 0),
    0
  );
  const autoModePillars = displayedSlots.reduce(
    (acc, slot) => acc + (slot.pillars?.filter(p => p.autoMode !== false).length || 0),
    0
  );

  return (
    <DashboardLayout navItems={navItems} title="Hệ thống Máy Bơm Trụ Tưới Nước">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Droplets className="w-6 h-6" />
              </span>
              Bảng Điều Khiển Máy Bơm Theo Trụ & Ô Vườn
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Mỗi trụ được trang bị 1 máy bơm riêng biệt. Bạn chỉ có thể điều khiển máy bơm của các ô vườn được phân công trực.
            </p>
          </div>
          <button
            onClick={() => fetchAssignedPumps()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Slot Selector Dropdown */}
        {assignedSlots.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Lọc theo Ô Vườn:</h3>
                <p className="text-xs text-gray-500">
                  {selectedSlotFilter === 'all'
                    ? `Đang hiển thị toàn bộ ${assignedSlots.length} ô vườn được phân công`
                    : `Đang thu gọn xem riêng ${displayedSlots[0]?.slotNumber || ''}`}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto min-w-[300px]">
              <select
                value={selectedSlotFilter}
                onChange={(e) => setSelectedSlotFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">
                  🌐 Tất cả ô vườn ({assignedSlots.length} ô • {assignedSlots.reduce((a, s) => a + (s.pillars?.length || 0), 0)} máy bơm)
                </option>
                {assignedSlots.map((slot) => (
                  <option key={slot.slotId} value={String(slot.slotId)}>
                    🌱 Ô Vườn {slot.slotNumber} ({slot.pillars?.length || 0} trụ{slot.locationName ? ` - ${slot.locationName}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Ô vườn phụ trách</p>
              <p className="text-xl font-bold text-gray-900">{totalSlots}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng trụ (máy bơm)</p>
              <p className="text-xl font-bold text-gray-900">{totalPillars}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <Droplets className={`w-5 h-5 ${runningPillars > 0 ? 'text-teal-600 animate-bounce' : ''}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Đang phun tưới</p>
              <p className={`text-xl font-bold ${runningPillars > 0 ? 'text-teal-600' : 'text-gray-900'}`}>
                {runningPillars} / {totalPillars}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Chế độ tự động</p>
              <p className="text-xl font-bold text-gray-900">{autoModePillars} trụ</p>
            </div>
          </div>
        </div>

        {/* Deep link alert from notification */}
        {targetPillarCode && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-950 text-xs sm:text-sm shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>
                Yêu cầu tưới nước khẩn cấp cho <strong>Trụ {targetPillarCode}</strong>. Hệ thống đã tự động mở ô vườn và làm nổi bật trụ cần tưới bên dưới.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Safety & Auto-Off Note */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/70 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-950">Quy chuẩn an toàn tưới nước thông minh:</span>
              <p className="mt-0.5 text-emerald-800">
                Khi bấm kích hoạt thủ công, máy bơm sẽ tự động chạy trong <span className="font-bold text-emerald-950">5 giây</span> rồi tự ngắt để bảo vệ bộ rễ rau thủy canh và cuộn hút rơ-le.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600 self-end md:self-center">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Tự ngắt: 5 giây/chu kỳ</span>
          </div>
        </div>

        {/* Main Content: Grouped by Garden Slot */}
        {isLoading && assignedSlots.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Đang tải danh sách ô vườn và máy bơm trụ...</p>
          </div>
        ) : assignedSlots.length === 0 ? (
          /* Empty State */
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Bạn chưa được phân công ô vườn nào</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
              Hệ thống chỉ hiển thị máy bơm của các trụ thuộc ô vườn bạn được giao làm việc hoặc có lịch trực. Vui lòng liên hệ Quản lý cơ sở để được phân công ô vườn.
            </p>
          </div>
        ) : (
          /* List of assigned slots */
          <div className="space-y-8">
            {displayedSlots.map((slot) => {
              const slotPillars = slot.pillars || [];
              const slotRunningCount = slotPillars.filter(p => p.pumpStatus === 'ON').length;
              const isSlotBusy = actionLoading[`slot_${slot.slotId}`] || actionLoading[`slot_off_${slot.slotId}`];

              return (
                <div key={slot.slotId} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                  {/* Slot Header */}
                  <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-emerald-50/30 p-5 border-b border-gray-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                        {slot.slotNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-gray-900">
                            Ô Vườn {slot.slotNumber}
                          </h2>
                          {slot.locationName && (
                            <span className="text-xs px-2.5 py-0.5 bg-gray-200 text-gray-700 rounded-full font-medium">
                              {slot.locationName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                          <span>Diện tích: <strong>{slot.area ? `${slot.area} m²` : 'Tiêu chuẩn'}</strong></span>
                          <span>•</span>
                          <span>Số trụ: <strong>{slotPillars.length} trụ</strong></span>
                          <span>•</span>
                          <span className={slotRunningCount > 0 ? 'text-emerald-600 font-semibold' : ''}>
                            Đang hoạt động: <strong>{slotRunningCount} máy bơm</strong>
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Batch Actions for Slot */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        onClick={() => handleTriggerAllInSlot(slot.slotId, slot.slotNumber, slotPillars.length)}
                        disabled={isSlotBusy || slotPillars.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        {actionLoading[`slot_${slot.slotId}`] ? 'Đang kích hoạt...' : 'Tưới tất cả trong ô (5s)'}
                      </button>

                      <button
                        onClick={() => handleTurnOffAllInSlot(slot.slotId, slot.slotNumber)}
                        disabled={isSlotBusy || slotPillars.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
                      >
                        <Power className="w-3.5 h-3.5" />
                        {actionLoading[`slot_off_${slot.slotId}`] ? 'Đang tắt...' : 'Tắt tất cả'}
                      </button>
                    </div>
                  </div>

                  {/* Pillars inside this slot */}
                  <div className="p-5">
                    {slotPillars.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                        Ô vườn này hiện chưa có trụ nào được gắn vào.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slotPillars.map((pillar) => {
                          const isPumpOn = pillar.pumpStatus === 'ON';
                          const isPillarBusy = actionLoading[`pillar_${pillar.pillarId}`];
                          const isAutoBusy = actionLoading[`auto_${pillar.pillarId}`];
                          const isAuto = pillar.autoMode !== false;
                          const isTargetPillar = Boolean(
                            targetPillarCode && pillar.pillarCode.toUpperCase() === targetPillarCode.toUpperCase()
                          );

                          return (
                            <div 
                              id={`pillar-card-${pillar.pillarCode.toUpperCase()}`}
                              key={pillar.pillarId}
                              className={`relative rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                                isTargetPillar
                                  ? 'ring-4 ring-amber-400 border-amber-500 shadow-xl shadow-amber-200/60 bg-amber-50/40'
                                  : isPumpOn 
                                    ? 'bg-gradient-to-b from-emerald-50/70 to-teal-50/40 border-emerald-300 shadow-md shadow-emerald-50' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                              }`}
                            >
                              {/* Urgent watering badge if targeted */}
                              {isTargetPillar && (
                                <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>CẦN TƯỚI NƯỚC GẤP (ĐỘ ẨM ĐẤT THẤP)</span>
                                </div>
                              )}

                              {/* Top row: Pillar Code & Type */}
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 text-base">
                                        {pillar.pillarCode}
                                      </span>
                                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/60">
                                        {pillar.pillarTypeName || 'Trụ Vừa'} ({pillar.capacityHoles || 36} hốc)
                                      </span>
                                    </div>
                                    <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
                                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                                      {pillar.treeName ? `Cây: ${pillar.treeName}` : 'Chưa gieo trồng'}
                                    </p>
                                  </div>

                                  {/* Pump Status badge */}
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    isPumpOn 
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 animate-pulse' 
                                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isPumpOn ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    {isPumpOn ? 'ĐANG BƠM (5s)' : 'CHỜ'}
                                  </span>
                                </div>

                                {/* Pump visual & reason */}
                                <div className="my-3 py-2 flex items-center gap-3 bg-white/70 rounded-lg p-2.5 border border-gray-100">
                                  <div className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                    isPumpOn ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    <Droplets className={`w-5 h-5 ${isPumpOn ? 'animate-bounce' : ''}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                      Máy bơm Trụ {pillar.pillarCode}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate" title={pillar.lastTriggerReason || ''}>
                                      {pillar.lastTriggerReason || 'Sẵn sàng hoạt động'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Controls */}
                              <div className="pt-2 border-t border-gray-100 space-y-2.5">
                                {/* Toggle auto-mode for this pillar */}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 font-medium flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    Tự động tưới:
                                  </span>
                                  <button
                                    onClick={() => handleTogglePillarAutoMode(pillar.pillarId, isAuto, pillar.pillarCode)}
                                    disabled={isAutoBusy}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
                                      isAuto ? 'bg-emerald-600' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                        isAuto ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Trigger pump button */}
                                <button
                                  onClick={() => handleTogglePillarPump(pillar.pillarId, pillar.pumpStatus, pillar.pillarCode)}
                                  disabled={isPillarBusy}
                                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white shadow transition-all active:scale-[0.98] disabled:opacity-50 ${
                                    isPumpOn
                                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  {isPillarBusy 
                                    ? 'Đang gửi...' 
                                    : isPumpOn 
                                      ? 'Tắt Máy Bơm' 
                                      : 'Bật tưới (5s tự ngắt)'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}