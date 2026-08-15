import { useState, useEffect, useMemo } from 'react';
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
  Filter,
} from 'lucide-react';
import { alertApi, AlertDTO, ProcessAlertPayload } from '../../api/alertApi';
import { managerApi } from '../../api/managerApi';
import { useAuth } from '../../context/AuthContext';
import { uploadTreeImage, deleteTreeImage } from '../../utils/firebaseUpload';
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
      window.alert('Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      await removeTempImage(evidenceImageUrl);
      const firebaseUrl = await uploadTreeImage(file);
      setEvidenceImageUrl(firebaseUrl);
    } catch (err) {
      console.error('Lỗi upload ảnh bằng chứng:', err);
      window.alert('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
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
      window.alert('Vui lòng nhập cách xử lý / lời bình!');
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
      onDone();
    } catch (err) {
      console.error('Lỗi gửi báo cáo xử lý:', err);
      window.alert('Gửi báo cáo thất bại! Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-gray-50/60 p-5 space-y-4 text-sm">
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
            <span>{isUploadingImage ? 'Đang tải lên...' : 'Chọn ảnh...'}</span>
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
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Lấy danh sách cảnh báo đang ở trạng thái PENDING (GET /alerts/pending)
  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await alertApi.getPendingAlerts();
      setAlerts(result);
    } catch (err) {
      console.error('Lỗi tải danh sách cảnh báo đang chờ:', err);
      setError('Không thể tải danh sách cảnh báo đang chờ xử lý.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
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

  const visibleAlerts = selectedLocationId
    ? alerts.filter((a) => String(pillarLocationMap.get(a.pillarId)) === selectedLocationId)
    : alerts;

  // Xử lý xong 1 alert: bỏ nó khỏi danh sách đang chờ (không cần gọi lại API), đóng form, báo thành công
  const handleProcessed = (alertId: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setExpandedId(null);
    setSuccessMsg('🎉 Đã gửi báo cáo xử lý cảnh báo thành công!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">
            Cảnh báo đang chờ xử lý: <span className="font-black text-gray-900">{visibleAlerts.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canFilterByLocation && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-green-600 shrink-0" />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white"
              >
                <option value="">Tất cả cơ sở</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            <span>Làm mới</span>
          </button>
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
          <CheckCircle2 className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Không có cảnh báo nào đang chờ xử lý 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            return (
              <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-gray-500 font-medium">
                    {locationNameMap.get(pillarLocationMap.get(alert.pillarId) ?? -1) && (
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
        </div>
      )}
    </>
  );
}
