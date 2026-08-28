import { useState, useEffect, useMemo } from 'react';
import {
  History,
  RefreshCw,
  MapPin,
  Grid3X3,
  Trees,
  Gauge,
  Clock,
  ChevronDown,
  User,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { alertApi, AlertDTO, AlertProcessingLogDTO } from '../../api/alertApi';
import { managerApi } from '../../api/managerApi';
import { useAuth } from '../../context/AuthContext';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã hoàn thành' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'ESCALATED', label: 'Đã leo thang' },
];

const ALERT_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200/60',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200/60',
  RESOLVED: 'bg-green-50 text-green-700 border-green-200/60',
  FAILED: 'bg-red-50 text-red-700 border-red-200/60',
  ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200/60',
};

const LOG_STATUS_STYLE: Record<string, string> = {
  PROCESSED: 'bg-green-50 text-green-700 border-green-200/60',
  NOT_PROCESSED: 'bg-blue-50 text-blue-700 border-blue-200/60',
  FAILED: 'bg-red-50 text-red-700 border-red-200/60',
};

const ALERT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Đang chờ',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã hoàn thành',
  FAILED: 'Thất bại',
  ESCALATED: 'Đã leo thang',
};

const LOG_STATUS_LABEL: Record<string, string> = {
  PROCESSED: 'Đã xử lý xong',
  NOT_PROCESSED: 'Chưa xử lý xong',
  FAILED: 'Thất bại',
};

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

// Danh sách log xử lý của 1 alert — chỉ gọi API khi người dùng thật sự mở rộng để xem (lazy load)
function AlertLogs({ alertId }: { alertId: number }) {
  const [logs, setLogs] = useState<AlertProcessingLogDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await alertApi.getAlertProcessingLogs(alertId);
        if (!cancelled) setLogs(result);
      } catch (err) {
        console.error('Lỗi tải lịch sử xử lý:', err);
        if (!cancelled) setError('Không thể tải lịch sử xử lý cảnh báo này.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogs();
    return () => { cancelled = true; };
  }, [alertId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch sử xử lý...
      </div>
    );
  }

  if (error) {
    return <div className="py-6 text-center text-sm text-red-600 font-medium">{error}</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="py-6 text-center text-sm text-gray-400 font-medium">Chưa có lần xử lý nào cho cảnh báo này.</div>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  'text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border',
                  LOG_STATUS_STYLE[log.status] || 'bg-gray-50 text-gray-700 border-gray-200/60'
                )}
              >
                {LOG_STATUS_LABEL[log.status] || log.status}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <User className="w-3.5 h-3.5 text-gray-400" /> {log.processedByName || 'N/A'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> {formatDateTime(log.processedAt)}
            </span>
          </div>

          {log.comment && (
            <p className="text-sm text-gray-700 flex items-start gap-1.5 mt-2">
              <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{log.comment}</span>
            </p>
          )}

          {log.evidenceImageUrl && (
            <a
              href={log.evidenceImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-green-700 hover:text-green-800"
            >
              <ImageIcon className="w-4 h-4" />
              <img
                src={log.evidenceImageUrl}
                alt="Ảnh bằng chứng"
                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
              />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// Trang "Lịch sử Xử lý Cảnh báo": xem toàn bộ alert (lọc theo trạng thái) + mở rộng để xem log xử lý chi tiết
export default function AlertHistory() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [pillars, setPillars] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = statusFilter
        ? await alertApi.getAlertsByStatus(statusFilter)
        : await alertApi.getAllAlerts();
      // Mới nhất lên trước
      setAlerts([...result].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)));
    } catch (err) {
      console.error('Lỗi tải lịch sử cảnh báo:', err);
      setError('Không thể tải danh sách cảnh báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  // Chỉ manager/admin mới cần chọn cơ sở (location_manager luôn chỉ có đúng 1 cơ sở, Backend đã tự lọc sẵn)
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
    const filtered = selectedLocationId
      ? alerts.filter((a) => a.pillarId != null && String(pillarLocationMap.get(a.pillarId)) === selectedLocationId)
      : alerts;
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return b.id - a.id;
    });
  }, [alerts, selectedLocationId, pillarLocationMap]);

  const totalPages = Math.ceil(visibleAlerts.length / pageSize) || 1;
  const paginatedAlerts = visibleAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout navItems={staffNavItems} title="Lịch sử Xử lý Cảnh báo">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <History className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-700 mr-2">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {canFilterByLocation && (
            <>
              <MapPin className="w-5 h-5 text-green-600 shrink-0 ml-2" />
              <span className="text-sm font-semibold text-gray-700 mr-2">Cơ sở:</span>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
              >
                <option value="">Tất cả cơ sở</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
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

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang tải danh sách cảnh báo...</p>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <History className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Không có cảnh báo nào phù hợp bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            return (
              <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                        <History className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200/60 px-2.5 py-1 rounded-full">
                            {alert.alertType}
                          </span>
                          <span
                            className={clsx(
                              'text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border',
                              ALERT_STATUS_STYLE[alert.status] || 'bg-gray-50 text-gray-700 border-gray-200/60'
                            )}
                          >
                            {ALERT_STATUS_LABEL[alert.status] || alert.status}
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
                        isExpanded ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span>{isExpanded ? 'Đóng' : 'Xem lịch sử xử lý'}</span>
                      <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
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
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Tạo lúc: {formatDateTime(alert.createdAt)}
                    </span>
                    {alert.resolvedAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Xong lúc: {formatDateTime(alert.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-5">
                    <AlertLogs alertId={alert.id} />
                  </div>
                )}
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
    </DashboardLayout>
  );
}
