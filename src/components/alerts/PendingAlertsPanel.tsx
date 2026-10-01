import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  RefreshCw,
  MapPin,
  Grid3X3,
  Trees,
  Gauge,
  Clock,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  Send,
  ChevronDown,
  Search,
  Zap,
  Droplets,
} from 'lucide-react';
import { alertApi, AlertDTO, ProcessAlertPayload } from '../../api/alertApi';
import { managerApi } from '../../api/managerApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { uploadTreeImage, deleteTreeImage } from '../../utils/firebaseUpload';
import Pagination from '../common/Pagination';
import clsx from 'clsx';

// Định dạng ngày giờ theo kiểu Việt Nam (dd/mm/yyyy hh:mm) để hiển thị createdAt của alert
function formatDateTime(dateString?: string | null) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

// Form xử lý 1 cảnh báo cụ thể: chọn kết quả xử lý, ghi chú, đính kèm ảnh hiện trường (tùy chọn),
// rồi gửi lên backend qua alertApi.processAlert (POST /alerts/process)
function ProcessForm({ alert, onDone }: { alert: AlertDTO; onDone: () => void }) {
  const [status, setStatus] = useState<'RESOLVED' | 'IN_PROGRESS' | 'FAILED'>('RESOLVED');
  const toast = useToast();
  const [comment, setComment] = useState('');
  const [evidenceImageUrl, setEvidenceImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xóa ảnh cũ trên Firebase Storage khi người dùng chọn ảnh khác hoặc bỏ ảnh, tránh rác ảnh không dùng
  const removeTempImage = async (urlToRemove?: string) => {
    if (!urlToRemove) return;
    await deleteTreeImage(urlToRemove);
  };

  // Tải ảnh bằng chứng lên Firebase Storage, lưu link trả về vào state để gửi kèm báo cáo
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      await removeTempImage(evidenceImageUrl);
      const firebaseUrl = await uploadTreeImage(file);
      setEvidenceImageUrl(firebaseUrl);
      toast.success('Tải ảnh bằng chứng thành công!');
    } catch (err) {
      console.error('Lỗi upload ảnh bằng chứng:', err);
      toast.error('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    await removeTempImage(evidenceImageUrl);
    setEvidenceImageUrl('');
  };

  // Gửi báo cáo xử lý lên backend; báo thành công thì gọi onDone() để component cha
  // (danh sách cảnh báo) gỡ alert này khỏi danh sách đang chờ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.warning('Vui lòng nhập cách xử lý / lời bình!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProcessAlertPayload = {
        alertId: alert.id,
        status,
        comment: comment.trim(),
        evidenceImageUrl: evidenceImageUrl || undefined,
      };
      await alertApi.processAlert(payload);
      toast.success('Gửi báo cáo xử lý cảnh báo thành công!');
      onDone();
    } catch (err) {
      console.error('Lỗi gửi báo cáo xử lý:', err);
      toast.error('Gửi báo cáo thất bại! Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="border-t border-gray-100 bg-gray-50/60 p-5 space-y-4 text-sm">
      <div>
        <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-green-600" /> Trạng thái xử lý
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'RESOLVED', label: 'Đã hoàn thành', cls: 'border-green-500 bg-green-50 text-green-700' },
            { val: 'IN_PROGRESS', label: 'Đang xử lý', cls: 'border-blue-500 bg-blue-50 text-blue-700' },
            { val: 'FAILED', label: 'Thất bại', cls: 'border-red-500 bg-red-50 text-red-700' },
          ].map((opt) => {
            const isSelected = status === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => setStatus(opt.val as any)}
                className={clsx(
                  'py-2.5 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 select-none',
                  isSelected ? `${opt.cls} ring-2 ring-offset-1 ring-current shadow-sm` : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium'
                )}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-green-600" /> Ghi chú cách khắc phục <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          placeholder="VD: Đã kiểm tra cảm biến, tiến hành tưới bổ sung 15 phút..."
          className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800 bg-white"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-green-600" /> Ảnh bằng chứng <span className="text-gray-400 font-normal">(Tùy chọn)</span>
        </label>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 overflow-hidden relative group">
            {isUploadingImage ? (
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            ) : evidenceImageUrl ? (
              <>
                <img src={evidenceImageUrl} alt="Evidence" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <label className={clsx(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm transition',
            isUploadingImage && 'opacity-50 pointer-events-none'
          )}>
            <Upload className="w-4 h-4 text-green-600" />
            <span>{isUploadingImage ? 'Đang gửi ảnh...' : evidenceImageUrl ? 'Gửi ảnh khác' : 'Gửi ảnh'}</span>
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploadingImage} className="hidden" />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isUploadingImage}
        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi báo cáo...</>
        ) : (
          <><Send className="w-4 h-4" /> Gửi báo cáo xử lý</>
        )}
      </button>
    </form>
  );
}

/**
 * Danh sách cảnh báo PENDING kèm form xử lý tại chỗ.
 * Dùng chung cho trang Xử lý Cảnh báo (manager/location_manager) và Cảnh báo IoT (garden_staff).
 */
export default function PendingAlertsPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [sensorFilter, setSensorFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Batch process state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchComment, setBatchComment] = useState('Đã kiểm tra hệ thống và xử lý cảnh báo định kỳ.');
  const [batchLoading, setBatchLoading] = useState(false);

  // Lấy danh sách cảnh báo đang ở trạng thái PENDING (GET /alerts/pending)
  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await alertApi.getPendingAlerts();
      setAlerts(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Lỗi tải danh sách cảnh báo đang chờ:', err);
      if (!silent) setError('Không thể tải danh sách cảnh báo đang chờ xử lý.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Live polling: Tự động cập nhật danh sách cảnh báo mỗi 15 giây
  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(() => {
      fetchAlerts(true);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Chỉ manager/admin mới cần chọn cơ sở (location_manager và garden_staff luôn chỉ có đúng 1 cơ sở, Backend đã tự lọc sẵn)
  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      managerApi.getLocations().then((res: any) => setLocations(res || [])).catch((err: any) => {
        console.error('Không thể tải danh sách cơ sở:', err);
      });
      managerApi.getPillars().then((res: any) => setPillars(res || [])).catch((err: any) => {
        console.error('Không thể tải danh sách trụ:', err);
      });
    }
  }, [user]);

  const pillarLocationMap = useMemo(() => {
    const map = new Map<number, number>();
    pillars.forEach((p: any) => { if (p.locationId != null) map.set(p.id, p.locationId); });
    return map;
  }, [pillars]);

  const locationNameMap = useMemo(() => {
    const map = new Map<number, string>();
    locations.forEach((l: any) => map.set(l.id, l.name));
    return map;
  }, [locations]);

  const canFilterByLocation = (user?.role === 'manager' || user?.role === 'admin') && locations.length > 0;

  const visibleAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        // Lọc theo cơ sở (Manager/Admin)
        if (selectedLocationId && a.pillarId != null) {
          if (String(pillarLocationMap.get(a.pillarId)) !== selectedLocationId) return false;
        }

        // Lọc theo loại cảm biến
        if (sensorFilter !== 'ALL') {
          const typeStr = `${a.sensorType || ''} ${a.alertType || ''}`.toUpperCase();
          if (!typeStr.includes(sensorFilter)) return false;
        }

        // Tìm kiếm theo từ khóa (Trụ, Ô, Cây, Nội dung)
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchPillar = (a.pillarCode || '').toLowerCase().includes(q);
          const matchSlot = (a.slotNumber || '').toLowerCase().includes(q);
          const matchTree = (a.treeName || '').toLowerCase().includes(q);
          const matchDesc = (a.description || '').toLowerCase().includes(q);
          const matchType = (a.alertType || '').toLowerCase().includes(q);
          if (!matchPillar && !matchSlot && !matchTree && !matchDesc && !matchType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [alerts, selectedLocationId, pillarLocationMap, sensorFilter, search]);

  const totalPages = Math.ceil(visibleAlerts.length / pageSize) || 1;
  const paginatedAlerts = visibleAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Xử lý xong 1 alert: bỏ nó khỏi danh sách đang chờ (không cần gọi lại API), đóng form, báo thành công
  const handleProcessed = (alertId: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setExpandedId(null);
    setSuccessMsg('🎉 Đã gửi báo cáo xử lý cảnh báo thành công!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Xử lý hàng loạt cảnh báo đang hiển thị
  const handleBatchProcess = async () => {
    if (visibleAlerts.length === 0) return;
    setBatchLoading(true);
    try {
      const ids = visibleAlerts.map(a => a.id);
      const res = await alertApi.batchProcessAlerts({
        alertIds: ids,
        status: 'RESOLVED',
        comment: batchComment.trim() || 'Đã xử lý hàng loạt cảnh báo.',
      });
      toast.success(res.message || `Đã giải quyết thành công ${ids.length} cảnh báo!`);
      setAlerts(prev => prev.filter(a => !ids.includes(a.id)));
      setBatchModalOpen(false);
      setSuccessMsg(`🎉 Đã giải quyết thành công ${ids.length} cảnh báo!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi khi xử lý hàng loạt:', err);
      toast.error('Xử lý hàng loạt thất bại. Vui lòng thử lại!');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <>
      {/* 1. Header Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-green-50 text-green-700 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-green-600 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">
                  Cảnh báo đang chờ xử lý: <span className="font-black text-gray-900 text-base">{visibleAlerts.length}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trực tiếp (15s)
                </span>
              </div>
              <p className="text-xs text-gray-500">Các cảnh báo cảm biến vượt ngưỡng sinh trưởng cần khắc phục</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Nút Xử lý hàng loạt */}
            {visibleAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => setBatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                title="Đánh dấu tất cả cảnh báo đang lọc là đã xử lý"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Xử lý tất cả ({visibleAlerts.length})</span>
              </button>
            )}

            {/* Nút Làm mới */}
            <button
              type="button"
              onClick={() => fetchAlerts(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 2. Thanh tìm kiếm và bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã trụ, ô vườn, loại cây..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-7 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-gray-50/50 hover:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo Loại Cảm Biến */}
          <div className="flex items-center gap-2">
            <select
              value={sensorFilter}
              onChange={(e) => {
                setSensorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white"
            >
              <option value="ALL">Tất cả loại cảm biến</option>
              <option value="SOIL_MOISTURE">💧 Độ ẩm đất (Soil Moisture)</option>
              <option value="TEMPERATURE">🌡️ Nhiệt độ (Temperature)</option>
              <option value="HUMIDITY">💨 Độ ẩm không khí (Air Humidity)</option>
              <option value="LIGHT_INTENSITY">☀️ Cường độ ánh sáng (Light)</option>
              <option value="PH">🧪 Độ pH đất</option>
            </select>
          </div>

          {/* Lọc theo Cơ sở (Chỉ cho Manager / Admin) */}
          {canFilterByLocation && (
            <div className="flex items-center gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white"
              >
                <option value="">🏢 Tất cả cơ sở</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
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

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-4 py-3 mb-6 text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang tải danh sách cảnh báo...</p>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CheckCircle2 className="w-10 h-10 opacity-30 text-emerald-600" />
          <p className="text-sm font-bold text-gray-700">Không có cảnh báo nào đang chờ xử lý 🎉</p>
          <p className="text-xs text-gray-400">Tất cả cảm biến và cây trồng đều đang ở trạng thái an toàn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const isSoilMoisture = (alert.sensorType || alert.alertType || '').toUpperCase().includes('MOISTURE');

            return (
              <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full">
                            {alert.alertType}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">#{alert.id}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mt-1.5 max-w-lg">{alert.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Phím tắt Điều khiển máy bơm nếu là cảnh báo độ ẩm đất */}
                      {isSoilMoisture && (
                        <Link
                          to={`/dashboard/garden-staff/pump-control?slotId=${alert.gardenSlotId || ''}&pillarCode=${alert.pillarCode || ''}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs"
                          title="Mở màn hình Điều khiển máy bơm cho trụ này"
                        >
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kích hoạt Bơm</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition shrink-0',
                          isExpanded ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                        )}
                      >
                        <span>{isExpanded ? 'Đóng' : 'Xử lý ngay'}</span>
                        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-gray-500 font-medium">
                    {alert.pillarId != null && locationNameMap.get(pillarLocationMap.get(alert.pillarId) ?? -1) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {locationNameMap.get(pillarLocationMap.get(alert.pillarId) ?? -1)}
                      </span>
                    )}
                    {alert.pillarCode && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Trụ: {alert.pillarCode}
                      </span>
                    )}
                    {alert.slotNumber && (
                      <span className="inline-flex items-center gap-1.5">
                        <Grid3X3 className="w-3.5 h-3.5 text-gray-400" /> Ô vườn: {alert.slotNumber}
                      </span>
                    )}
                    {alert.treeName && (
                      <span className="inline-flex items-center gap-1.5">
                        <Trees className="w-3.5 h-3.5 text-gray-400" /> Cây: {alert.treeName}
                      </span>
                    )}
                    {alert.actualValue != null && alert.thresholdValue != null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        {alert.sensorType}: <span className="font-bold text-gray-700">{alert.actualValue}</span> (ngưỡng {alert.thresholdValue})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {formatDateTime(alert.createdAt)}
                    </span>
                  </div>
                </div>

                {isExpanded && <ProcessForm alert={alert} onDone={() => handleProcessed(alert.id)} />}
              </div>
            );
          })}

          {visibleAlerts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={visibleAlerts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="cảnh báo"
              />
            </div>
          )}
        </div>
      )}

      {/* 3. Modal Xử lý hàng loạt cảnh báo */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Xử lý hàng loạt cảnh báo</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn đánh dấu toàn bộ <span className="font-bold text-gray-900">{visibleAlerts.length} cảnh báo</span> đang hiển thị là <span className="font-bold text-emerald-700">ĐÃ HOÀN THÀNH (RESOLVED)</span> không? Hệ thống cũng sẽ tự động hoàn tất các nhiệm vụ khẩn cấp liên quan.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Ghi chú khắc phục hàng loạt:
              </label>
              <textarea
                rows={3}
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                placeholder="Nhập ghi chú cách xử lý..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={batchLoading}
                onClick={handleBatchProcess}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Xác nhận xử lý ({visibleAlerts.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
