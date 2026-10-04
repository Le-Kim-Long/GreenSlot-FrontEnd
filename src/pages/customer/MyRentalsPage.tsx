import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, CreditCard, Calendar, Clock, Loader2, X, AlertTriangle, Sprout, PlusCircle, Plus, Minus, Info, Layers, Wifi, Camera, Maximize2, ExternalLink, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import type { AddPillarsPreview } from '../../types/api';
import { managerApi } from '../../api/managerApi';
import { taskApi } from '../../api/taskApi';
import { customerNavItems as navItems } from './customerNavItems';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang thuê', cls: 'badge-green' },
  PENDING: { label: 'Chờ xác nhận', cls: 'badge-yellow' },
  CANCELLED: { label: 'Đã hủy', cls: 'badge-red' },
  EXPIRED: { label: 'Đã hoàn thành', cls: 'badge-gray' },
};

const paymentConfig: Record<string, { label: string; cls: string }> = {
  SUCCESS: { label: 'Đã thanh toán', cls: 'badge-green' },
  PENDING: { label: 'Chờ thanh toán', cls: 'badge-yellow' },
  FAILED: { label: 'Thất bại', cls: 'badge-red' },
  EXPIRED: { label: 'Hết hạn thanh toán', cls: 'badge-gray' },
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [extendModal, setExtendModal] = useState<BookingHistory | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendMonthsInput, setExtendMonthsInput] = useState('1');
  const [extendMonthsError, setExtendMonthsError] = useState('');
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [cancelModal, setCancelModal] = useState<BookingHistory | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRentalId, setExpandedRentalId] = useState<number | null>(null); // Thêm state quản lý mở rộng chi tiết trụ

  // Yêu cầu thu hoạch sớm
  const [earlyHarvestModal, setEarlyHarvestModal] = useState<BookingHistory | null>(null);
  const [earlyHarvestMethod, setEarlyHarvestMethod] = useState<'SELF' | 'STAFF'>('STAFF');
  const [earlyHarvestPillar, setEarlyHarvestPillar] = useState<string>('');
  const [earlyHarvestNotes, setEarlyHarvestNotes] = useState<string>('');
  const [earlyHarvestSubmitting, setEarlyHarvestSubmitting] = useState(false);
  const [earlyHarvestError, setEarlyHarvestError] = useState('');

  // Modal thông báo thành công chuyên nghiệp (thay thế window.alert)
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    method?: 'SELF' | 'STAFF';
  }>({ isOpen: false, title: '', message: '' });

  const handleEarlyHarvestSubmit = async () => {
    if (!earlyHarvestModal) return;
    setEarlyHarvestSubmitting(true);
    setEarlyHarvestError('');
    try {
      await bookingApi.recordHarvestDecision(
        earlyHarvestModal.id,
        earlyHarvestMethod,
        earlyHarvestPillar || undefined,
        earlyHarvestNotes
      );
      const isSelf = earlyHarvestMethod === 'SELF';
      const notesCopy = earlyHarvestNotes;
      const targetPillarCopy = earlyHarvestPillar;
      const slotNum = earlyHarvestModal.slotNumber;
      setEarlyHarvestModal(null);
      setEarlyHarvestNotes('');
      setEarlyHarvestPillar('');
      fetchHistory();
      setSuccessModal({
        isOpen: true,
        title: isSelf ? 'Đã ghi nhận bạn tự thu hoạch thành công!' : 'Đã gửi yêu cầu thu hoạch sớm cho nhân viên!',
        message: isSelf
          ? `Hệ thống đã lưu đợt thu hoạch tại Ô ${slotNum} vào Lịch sử thu hoạch. Trụ canh tác đã được giải phóng để bạn sẵn sàng gieo trồng giống cây mới.`
          : `Yêu cầu thu hoạch sớm tại Ô ${slotNum} đã được gửi đến nhân viên làm vườn ca trực hôm nay. Nhân viên sẽ tiến hành thu hoạch, chụp ảnh nghiệm thu và bàn giao cho bạn.`,
        detail: notesCopy ? `Ghi chú dặn dò: "${notesCopy}"` : (targetPillarCopy ? `Trụ thu hoạch: ${targetPillarCopy}` : undefined),
        method: earlyHarvestMethod,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEarlyHarvestError(msg || 'Gửi yêu cầu thu hoạch sớm thất bại. Vui lòng thử lại.');
    } finally {
      setEarlyHarvestSubmitting(false);
    }
  };

  const handleExtendMonthsChange = (rawVal: string) => {
    // Chỉ giữ chữ số, loại bỏ âm (-), thập phân (., ,), chữ cái
    const cleaned = rawVal.replace(/\D/g, '');
    setExtendMonthsInput(cleaned);

    if (!cleaned) {
      setExtendMonths(0);
      setExtendMonthsError('Vui lòng nhập số tháng gia hạn (tối thiểu 1 tháng).');
      return;
    }

    const num = parseInt(cleaned, 10);
    if (isNaN(num) || num < 1) {
      setExtendMonths(0);
      setExtendMonthsError('Số tháng gia hạn phải là số tự nhiên dương (tối thiểu 1 tháng).');
      return;
    }

    if (num > 120) {
      setExtendMonths(num);
      setExtendMonthsError('Số tháng gia hạn tối đa là 120 tháng (10 năm).');
      return;
    }

    setExtendMonths(num);
    setExtendMonthsError('');
    setExtendError('');
  };

  // Báo cáo sự cố
  const [reportModal, setReportModal] = useState<BookingHistory | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState<number>(0);
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    bookingApi.getHistory()
      .then(data => setRentals(Array.isArray(data) ? data.filter(r => r.paymentStatus !== 'FAILED') : []))
      .catch(() => setError('Không thể tải lịch sử thuê'))
      .finally(() => setLoading(false));
  };

  const fetchServiceTypes = () => {
    managerApi.getServiceTypes()
      .then(data => {
        setServiceTypes(data || []);
        if (data && data.length > 0) setServiceTypeId(data[0].id);
      })
      .catch(() => {});
  };

  useEffect(() => { 
    fetchHistory(); 
    fetchServiceTypes();
  }, []);

  const filtered = useMemo(() => {
    const list = tab === 'all' ? rentals : rentals.filter(r => r.status === tab);
    return [...list].sort((a, b) => {
      const tA = new Date(a.startTime || a.startDate || 0).getTime();
      const tB = new Date(b.startTime || b.startDate || 0).getTime();
      if (tA !== tB) return tB - tA;
      return b.id - a.id;
    });
  }, [rentals, tab]);

  const tabs = [
    { key: 'all', label: 'Tất cả', count: rentals.length },
    { key: 'ACTIVE', label: 'Đang thuê', count: rentals.filter(r => r.status === 'ACTIVE').length },
    { key: 'PENDING', label: 'Chờ xác nhận', count: rentals.filter(r => r.status === 'PENDING').length },
    { key: 'EXPIRED', label: 'Đã hoàn thành', count: rentals.filter(r => r.status === 'EXPIRED').length },
    { key: 'CANCELLED', label: 'Đã hủy', count: rentals.filter(r => r.status === 'CANCELLED').length },
  ];

  const handleExtend = async () => {
    if (!extendModal) return;
    if (!extendMonths || extendMonths < 1 || !Number.isInteger(extendMonths)) {
      setExtendError('Số tháng gia hạn không hợp lệ: Vui lòng nhập số tự nhiên dương (tối thiểu 1 tháng).');
      return;
    }
    if (extendMonths > 120) {
      setExtendError('Số tháng gia hạn không được vượt quá 120 tháng (10 năm).');
      return;
    }
    setExtending(true);
    setExtendError('');
    try {
      const result = await bookingApi.extendBooking({
        rentalId: extendModal.id,
        durationInMonths: extendMonths,
        redirectUrl: `${window.location.origin}/payment-result`,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setExtendModal(null);
        fetchHistory();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setExtendError(msg || 'Gia hạn thất bại. Vui lòng thử lại.');
    } finally {
      setExtending(false);
    }
  };

  const handlePay = async (rental: BookingHistory) => {
    setPayingId(rental.id);
    setError('');
    try {
      const result = await bookingApi.getPaymentUrl(rental.id);
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Không thể lấy link thanh toán. Vui lòng thử lại.');
    } finally {
      setPayingId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    setCancelError('');
    try {
      await bookingApi.cancelBooking(cancelModal.id);
      setCancelModal(null);
      fetchHistory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCancelError(msg || 'Hủy đặt chỗ thất bại. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const handleHarvestDecision = async (rentalId: number, decision: 'SELF' | 'STAFF', pillarCode?: string) => {
    setDecidingId(rentalId);
    try {
      await bookingApi.recordHarvestDecision(rentalId, decision, pillarCode);
      fetchHistory();
      setSuccessModal({
        isOpen: true,
        title: decision === 'SELF' ? 'Ghi nhận tự thu hoạch thành công!' : 'Đã gửi yêu cầu nhân viên hỗ trợ thu hoạch!',
        message: decision === 'SELF'
          ? 'Hệ thống đã lưu đợt thu hoạch vào Lịch sử thu hoạch. Ô đất đã sẵn sàng để bạn đăng ký gieo trồng giống cây mới.'
          : 'Yêu cầu của bạn đã được gửi đến nhân viên làm vườn. Nhân viên sẽ tiến hành thu hoạch, chụp ảnh nghiệm thu và bàn giao cho bạn.',
        detail: pillarCode ? `Trụ thu hoạch: ${pillarCode}` : undefined,
        method: decision,
      });
    } catch {
      setError('Ghi nhận lựa chọn thất bại. Vui lòng thử lại.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportModal) return;
    if (!serviceTypeId) {
      setReportError('Vui lòng chọn loại sự cố / dịch vụ');
      return;
    }
    
    setReporting(true);
    setReportError('');
    setReportSuccess('');
    try {
      await taskApi.requestService({
        slotId: reportModal.slotId,
        serviceTypeId,
        description: reportDesc
      });
      setReportSuccess('Đã gửi báo cáo sự cố thành công!');
      setTimeout(() => {
        setReportModal(null);
        setReportDesc('');
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setReportError(msg || 'Gửi báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setReporting(false);
    }
  };

  // Thuê thêm trụ
  const [addPillarsModal, setAddPillarsModal] = useState<BookingHistory | null>(null);
  const [smallCount, setSmallCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [largeCount, setLargeCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AddPillarsPreview | null>(null);
  const [addPillarsSubmitting, setAddPillarsSubmitting] = useState(false);
  const [addPillarsError, setAddPillarsError] = useState('');

  const handleOpenAddPillars = (rental: BookingHistory) => {
    setAddPillarsModal(rental);
    setSmallCount(0);
    setMediumCount(0);
    setLargeCount(0);
    setAddPillarsError('');
    setPreviewData(null);
  };

  useEffect(() => {
    if (!addPillarsModal) return;
    let isMounted = true;
    setPreviewLoading(true);
    bookingApi.previewAddPillars(addPillarsModal.id, { smallCount, mediumCount, largeCount })
      .then(data => {
        if (isMounted) {
          setPreviewData(data);
          setAddPillarsError('');
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setAddPillarsError(msg || 'Lỗi khi tính toán chi phí thuê thêm trụ.');
        }
      })
      .finally(() => {
        if (isMounted) setPreviewLoading(false);
      });
    return () => { isMounted = false; };
  }, [addPillarsModal, smallCount, mediumCount, largeCount]);

  const handleAddPillarsSubmit = async () => {
    if (!addPillarsModal) return;
    const total = smallCount + mediumCount + largeCount;
    if (total <= 0) {
      setAddPillarsError('Vui lòng chọn ít nhất 1 trụ muốn thuê thêm.');
      return;
    }
    setAddPillarsSubmitting(true);
    setAddPillarsError('');
    try {
      const result = await bookingApi.addPillars(addPillarsModal.id, {
        smallCount,
        mediumCount,
        largeCount,
        redirectUrl: `${window.location.origin}/payment-result`,
      });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setAddPillarsModal(null);
        fetchHistory();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddPillarsError(msg || 'Thuê thêm trụ thất bại. Vui lòng thử lại.');
    } finally {
      setAddPillarsSubmitting(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Vườn đang thuê">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý thuê vườn</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tất cả ô vườn bạn đang và đã thuê</p>
        </div>
        <Link to="/gardens" className="btn-primary flex items-center gap-2 text-sm">Thuê thêm</Link>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => {
            setTab(t.key);
            setCurrentPage(1);
          }}
            className={clsx('flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium', tab === t.key ? 'bg-white shadow-sm' : 'text-gray-500')}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <Link to="/gardens" className="btn-primary inline-flex">Khám phá vườn</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const totalPages = Math.ceil(filtered.length / pageSize) || 1;
            const paginatedRentals = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            return (
              <>
                {paginatedRentals.map((rental: BookingHistory) => {
                  const st = statusConfig[rental.status] || { label: rental.status, cls: 'badge-gray' };
                  const pay = rental.paymentStatus ? paymentConfig[rental.paymentStatus] : null;
                  const slotArea = rental.slotArea || 10.0;
                  const isExpanded = expandedRentalId === rental.id; // Kiểm tra xem thẻ này có đang được mở chi tiết hay không
                  let currentUsedArea = (rental.pillars || []).reduce((sum, p) => {
                    const req = p.requiredArea || (p.capacityHoles && p.capacityHoles >= 48 ? 2.0 : (p.capacityHoles && p.capacityHoles >= 36 ? 1.5 : 1.0));
                    return sum + req;
                  }, 0);
                  if (currentUsedArea === 0 && rental.pillarCode && rental.pillarCode !== 'N/A' && rental.pillarCode !== 'arduino-greenhouse-01') {
                    currentUsedArea = 1.0;
                  }
                  const availableArea = Math.max(0, Number((slotArea - currentUsedArea).toFixed(1)));
                  return (
                    <div key={rental.id} className="card">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center">
                          <Leaf className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold">{rental.slotNumber}</h3>
                            {(() => {
                              const uniquePillars = Array.from(
                                new Map(
                                  (rental.pillars || [])
                                    .filter((p: any) => p.pillarCode && p.pillarCode !== 'arduino-greenhouse-01')
                                    .map((p: any) => [p.pillarCode, p])
                                ).values()
                              );
                              if (uniquePillars.length > 0) {
                                return (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {uniquePillars.map((p: any) => (
                                      <span key={p.id || p.pillarCode} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Trụ: {p.pillarCode} {p.treeName ? `(${p.treeName})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                );
                              }
                              if (rental.pillarCode && rental.pillarCode !== 'N/A' && rental.pillarCode !== 'arduino-greenhouse-01') {
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Trụ: {rental.pillarCode}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {rental.locationName && <div className="text-sm text-gray-500">{rental.locationName}</div>}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-gray-400" />
                              Diện tích ô: <span className="font-semibold text-gray-700">{slotArea} m²</span>
                            </span>
                            <span>•</span>
                            <span>Đã dùng: <span className="font-semibold text-emerald-700">{currentUsedArea.toFixed(1)} m²</span></span>
                            <span>•</span>
                            <span>Còn trống: <span className={clsx("font-semibold", availableArea >= 1.0 ? "text-green-600 font-bold" : "text-amber-600")}>{availableArea.toFixed(1)} m²</span></span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={st.cls}>{st.label}</span>
                            {pay && rental.status !== 'ACTIVE' && rental.paymentStatus !== 'SUCCESS' && rental.paymentStatus !== 'PAID' && (
                              <span className={pay.cls}>{pay.label}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {rental.startDate} — {rental.endDate}
                          </div>
                          <div className="font-bold text-green-600 mt-1">{rental.totalPrice.toLocaleString('vi-VN')}đ</div>

                          {rental.status === 'ACTIVE' && !rental.harvestNotifiedAt && (() => {
                            const pillarsWithTrees = (rental.pillars || []).filter(
                              (p: any) => p.treeName && p.pillarCode !== 'arduino-greenhouse-01'
                            );
                            const hasAnyTree = Boolean(rental.treeName) || pillarsWithTrees.length > 0;

                            if (!hasAnyTree) {
                              return (
                                <div className="text-sm text-gray-400 mt-2 flex items-center gap-1.5">
                                  <Sprout className="w-3.5 h-3.5 text-gray-300" />
                                  Chưa trồng cây nào trên ô này
                                </div>
                              );
                            }

                            if (pillarsWithTrees.length > 1) {
                              return (
                                <div className="text-sm text-gray-600 mt-2 flex items-start gap-1.5 flex-wrap">
                                  <Sprout className="w-3.5 h-3.5 text-green-600 mt-0.5" />
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {pillarsWithTrees.map((p: any) => (
                                      <span key={p.id || p.pillarCode}>
                                        {p.pillarCode}: <span className="font-semibold text-gray-800">{p.treeName}</span>
                                      </span>
                                    ))}
                                  </div>
                                  {rental.expectedHarvestAt && (
                                    <span className="text-xs text-gray-500 w-full mt-0.5 ml-5">
                                      · Dự kiến thu hoạch:{' '}
                                      <span className="font-semibold text-gray-800">
                                        {new Date(rental.expectedHarvestAt).toLocaleDateString('vi-VN')}
                                      </span>
                                      {(() => {
                                        const daysLeft = Math.ceil((new Date(rental.expectedHarvestAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                        return daysLeft > 0 ? <span className="text-gray-400"> (còn {daysLeft} ngày)</span> : null;
                                      })()}
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            const treeName = rental.treeName || pillarsWithTrees[0]?.treeName;
                            return (
                              <div className="text-sm text-gray-600 mt-2 flex items-center gap-1.5 flex-wrap">
                                <Sprout className="w-3.5 h-3.5 text-green-600" />
                                Đang trồng <span className="font-semibold text-gray-800">{treeName}</span>
                                {rental.expectedHarvestAt && (
                                  <>
                                    · Dự kiến thu hoạch:{' '}
                                    <span className="font-semibold text-gray-800">
                                      {new Date(rental.expectedHarvestAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    {(() => {
                                      const daysLeft = Math.ceil((new Date(rental.expectedHarvestAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                      return daysLeft > 0 ? <span className="text-gray-400">(còn {daysLeft} ngày)</span> : null;
                                    })()}
                                  </>
                                )}
                              </div>
                            );
                          })()}

                          {rental.status === 'ACTIVE' && rental.harvestNotifiedAt && !rental.harvestDecision && (
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm">
                              <div className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-1 flex-wrap">
                                <Sprout className="w-4 h-4 text-amber-600" />
                                <span>Cây {rental.treeName || ''} tại ô {rental.slotNumber} đã sẵn sàng thu hoạch!</span>
                                {rental.expectedHarvestAt && new Date(rental.expectedHarvestAt).getTime() > Date.now() && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 border border-amber-400 px-2 py-0.5 rounded-full">
                                    ⚡ Thu hoạch sớm
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-amber-800 font-semibold mb-2 flex items-center gap-1">
                                🏷️ Vị trí: Trụ {rental.harvestPillarCode || (rental.pillarCodes && rental.pillarCodes.length > 0 ? rental.pillarCodes.join(', ') : rental.pillarCode || 'Tất cả trụ')}
                              </div>

                              {/* Hình ảnh thực tế do nhân viên gửi lên kèm đề xuất thu hoạch sớm */}
                              {rental.harvestEvidenceImageUrl && (
                                <div className="my-3 bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                                      Ảnh cây rau thực tế (Nhân viên gửi):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(rental.harvestEvidenceImageUrl!)}
                                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 text-[11px]"
                                    >
                                      <Maximize2 className="w-3 h-3" /> Phóng to
                                    </button>
                                  </div>
                                  <div 
                                    className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-900 aspect-video max-h-48 flex items-center justify-center cursor-pointer group"
                                    onClick={() => setPreviewImage(rental.harvestEvidenceImageUrl!)}
                                  >
                                    <img
                                      src={rental.harvestEvidenceImageUrl}
                                      alt="Cây rau thực tế"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Lỗi+tải+ảnh';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                      <Maximize2 className="w-4 h-4" /> Bấm để phóng to
                                    </div>
                                  </div>
                                  {rental.harvestStaffNotes && (
                                    <div className="text-xs text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                                      <span className="font-semibold text-amber-800">Ghi chú của nhân viên:</span> {rental.harvestStaffNotes}
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className="text-xs text-amber-700 mb-3">Bạn muốn tự thu hoạch hay nhờ nhân viên hỗ trợ thu hoạch và bàn giao?</p>
                              <div className="flex gap-2">
                                <button
                                  disabled={decidingId === rental.id}
                                  onClick={() => handleHarvestDecision(rental.id, 'SELF', rental.harvestPillarCode)}
                                  className="btn-outline-green text-xs flex-1 py-2 font-medium"
                                >
                                  Tôi tự thu hoạch
                                </button>
                                <button
                                  disabled={decidingId === rental.id}
                                  onClick={() => handleHarvestDecision(rental.id, 'STAFF', rental.harvestPillarCode)}
                                  className="btn-primary text-xs flex-1 py-2 font-medium"
                                >
                                  {decidingId === rental.id ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                                  Nhờ nhân viên giúp
                                </button>
                              </div>
                            </div>
                          )}

                          {rental.status === 'ACTIVE' && rental.harvestDecision === 'STAFF' && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-2xs flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-blue-900">Đang chờ nhân viên thu hoạch</div>
                                <p className="text-[11px] text-blue-700 leading-snug">
                                  Yêu cầu đã được gửi đến nhân viên làm vườn. Lịch sử thu hoạch sẽ được cập nhật sau khi hoàn tất nghiệm thu.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 h-fit flex-wrap sm:flex-nowrap">
                          {rental.status === 'ACTIVE' && (
                            <>
                              <Link
                                to={`/dashboard/customer/monitoring?pillarCode=${rental.pillars?.[0]?.pillarCode || rental.pillarCode || ''}`}
                                className="text-xs flex items-center gap-1.5 h-fit px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors shadow-2xs w-full sm:w-auto justify-center"
                              >
                                <Wifi className="w-3.5 h-3.5 text-indigo-600" /> Theo dõi cảm biến
                              </Link>
                              <Link
                                to={`/dashboard/customer/tree-planting?rentalId=${rental.id}`}
                                className="btn-primary text-xs flex items-center gap-1 h-fit shadow-xs bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto justify-center"
                              >
                                <Sprout className="w-3.5 h-3.5" /> Trồng cây mới
                              </Link>
                              {Boolean(rental.treeName || (rental.pillars && rental.pillars.some((p: any) => p.treeName))) && rental.harvestDecision !== 'STAFF' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEarlyHarvestModal(rental);
                                    setEarlyHarvestMethod('STAFF');
                                    setEarlyHarvestPillar('');
                                    setEarlyHarvestNotes('');
                                    setEarlyHarvestError('');
                                  }}
                                  className="text-xs flex items-center gap-1.5 h-fit px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition-colors shadow-2xs w-full sm:w-auto justify-center"
                                  title="Gửi yêu cầu thu hoạch sớm cây trồng trên ô hoặc trụ"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-600" /> Thu hoạch sớm
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenAddPillars(rental)}
                                disabled={availableArea < 1.0}
                                title={availableArea < 1.0 ? "Ô vườn đã hết diện tích trống để đặt thêm trụ" : "Thuê thêm trụ khí canh vào ô vườn"}
                                className={clsx(
                                  "text-xs flex items-center gap-1 h-fit px-3 py-1.5 rounded-lg border font-medium transition-colors w-full sm:w-auto justify-center",
                                  availableArea >= 1.0
                                    ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                                )}
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Thuê thêm trụ
                              </button>
                              <button onClick={() => { setExtendModal(rental); setExtendMonths(1); setExtendMonthsInput('1'); setExtendMonthsError(''); setExtendError(''); }}
                                className="btn-outline-green text-xs flex items-center gap-1 h-fit w-full sm:w-auto justify-center">
                                <Clock className="w-3.5 h-3.5" /> Gia hạn
                              </button>
                              <button onClick={() => setReportModal(rental)}
                                className="btn-outline-red text-xs flex items-center gap-1 h-fit mt-2 sm:mt-0 w-full sm:w-auto justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" /> Báo cáo sự cố
                              </button>
                              
                              {/* Nút Xem chi tiết trụ canh tác */}
                              <button onClick={() => setExpandedRentalId(isExpanded ? null : rental.id)}
                                className="text-xs flex items-center justify-center gap-1.5 h-fit px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold transition-colors shadow-2xs mt-2 sm:mt-0 w-full sm:w-auto">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExpanded ? 'Ẩn chi tiết' : 'Chi tiết trụ'}
                              </button>
                            </>
                          )}
                          {(rental.status === 'PENDING' || rental.paymentStatus === 'PENDING') && rental.status !== 'CANCELLED' && (
                            <>
                              <button onClick={() => handlePay(rental)} disabled={payingId === rental.id}
                                className="btn-primary text-xs flex items-center gap-1 h-fit w-full sm:w-auto justify-center">
                                {payingId === rental.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <CreditCard className="w-3.5 h-3.5" />}
                                Thanh toán
                              </button>
                              <button onClick={() => setCancelModal(rental)}
                                className="btn-outline-red text-xs flex items-center gap-1 h-fit mt-2 sm:mt-0 w-full sm:w-auto justify-center">
                                <X className="w-3.5 h-3.5" /> Hủy
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Phần hiển thị chi tiết trụ (Thêm mới dựa trên FE Mobile) */}
                      {isExpanded && rental.pillars && rental.pillars.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                            <Sprout className="w-4 h-4 text-green-600" />
                            Chi tiết trụ canh tác
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rental.pillars.map((p: any, idx: number) => (
                              <div key={idx} className="bg-white border border-gray-100 shadow-xs rounded-xl p-3 flex items-center justify-between hover:border-green-200 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center">
                                    <Leaf className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">Trụ {p.pillarCode}</div>
                                    <div className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5">
                                      <Sprout className="w-3 h-3 text-green-600" />
                                      {p.treeName || rental.treeName || 'Chưa trồng cây'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/dashboard/customer/monitoring?pillarCode=${p.pillarCode}`}
                                    className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                    title="Theo dõi cảm biến"
                                  >
                                    <Wifi className="w-4 h-4" />
                                  </Link>
                                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md uppercase">
                                    {p.pillarType || 'MEDIUM'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filtered.length > 0 && (
                  <div className="card p-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filtered.length}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(sz) => {
                        setPageSize(sz);
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={[5, 10, 20]}
                      itemName="hợp đồng"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* CÁC MODAL HIỆN TẠI GIỮ NGUYÊN */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gia hạn hợp đồng</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ô vườn: <span className="font-semibold text-green-700">{extendModal.slotNumber}</span></p>
              </div>
              <button onClick={() => { setExtendModal(null); setExtendMonthsError(''); setExtendError(''); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Số tháng muốn gia hạn</label>
                <span className="text-xs text-gray-500 font-medium">(Tối thiểu 1 tháng)</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`input font-medium pr-16 ${extendMonthsError ? 'border-red-500 focus:ring-red-400' : ''}`}
                  placeholder="Nhập số tháng gia hạn..."
                  value={extendMonthsInput}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => handleExtendMonthsChange(e.target.value)}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">
                  tháng
                </div>
              </div>
              {extendMonthsError && (
                <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                  ⚠️ {extendMonthsError}
                </p>
              )}
              {/* Gợi ý chọn nhanh */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[1, 3, 6, 12, 24].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setExtendMonthsInput(m.toString());
                      setExtendMonths(m);
                      setExtendMonthsError('');
                      setExtendError('');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      extendMonths === m && !extendMonthsError
                        ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {m} tháng
                  </button>
                ))}
              </div>
            </div>

            {/* Chi tiết chi phí gia hạn */}
            {(() => {
              const extLandPrice = extendModal.landPrice ?? 0;
              const extPillarsPrice = extendModal.monthlyPillarsPrice ?? (
                extendModal.pillars?.reduce((sum, p) => sum + (p.price ?? 0), 0) ?? 0
              );
              const extUnitPrice = extendModal.monthlyPrice || (extLandPrice + extPillarsPrice);
              const extTotalCost = (extendMonths > 0 ? extendMonths : 0) * extUnitPrice;
              const pillarsCount = extendModal.pillars?.length || extendModal.pillarCodes?.length || 1;

              return (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Tiền thuê đất ô vườn:</span>
                      <span className="font-semibold text-gray-900">{extLandPrice.toLocaleString('vi-VN')} đ/tháng</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Tiền thuê trụ ({pillarsCount} trụ):</span>
                      <span className="font-semibold text-gray-900">{extPillarsPrice.toLocaleString('vi-VN')} đ/tháng</span>
                    </div>
                    {extendModal.pillars && extendModal.pillars.length > 0 && (
                      <div className="text-[11px] text-gray-500 pl-2.5 py-1 border-l-2 border-emerald-300 space-y-0.5 bg-emerald-100/40 rounded-r">
                        {extendModal.pillars.map((p, idx) => {
                          const type = p.pillarType?.toUpperCase();
                          const holes = p.capacityHoles || (type === 'LARGE' ? 48 : type === 'MEDIUM' ? 36 : 24);
                          const label = type === 'LARGE' || holes >= 48 ? `Trụ Lớn (${holes} hốc)` : type === 'MEDIUM' || holes >= 36 ? `Trụ Vừa (${holes} hốc)` : `Trụ Nhỏ (${holes} hốc)`;
                          return (
                            <div key={p.id || idx} className="flex justify-between">
                              <span>• {p.pillarCode} - {label}:</span>
                              <span className="font-medium text-gray-700">{(p.price || 0).toLocaleString('vi-VN')} đ/tháng</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-700 font-medium pt-1.5 border-t border-emerald-200/60">
                      <span>Tổng đơn giá thuê ô & trụ:</span>
                      <span className="font-semibold text-emerald-800">{extUnitPrice.toLocaleString('vi-VN')} đ/tháng</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Thời gian gia hạn:</span>
                      <span className="font-semibold text-gray-900">{extendMonths > 0 ? `${extendMonths} tháng` : '--'}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2.5 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Tổng tiền cần thanh toán:</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {extTotalCost.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {extendError && <div className="text-red-600 text-sm mb-3">{extendError}</div>}
                  <button
                    onClick={handleExtend}
                    disabled={extending || !extendMonths || extendMonths < 1 || Boolean(extendMonthsError)}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3"
                  >
                    {extending
                      ? 'Đang xử lý...'
                      : extTotalCost > 0
                      ? `Xác nhận & Thanh toán VNPay (${extTotalCost.toLocaleString('vi-VN')} đ)`
                      : 'Xác nhận & Thanh toán VNPay'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-5">
              <h2 className="text-xl font-bold">Hủy đặt chỗ</h2>
              <button onClick={() => setCancelModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc muốn hủy đặt chỗ ô vườn <span className="font-semibold">{cancelModal.slotNumber}</span>? Hành động này không thể hoàn tác.
            </p>
            {cancelError && <div className="text-red-600 text-sm mb-3">{cancelError}</div>}
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} disabled={cancelling} className="btn-secondary flex-1">
                Đóng
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="btn-outline-red flex-1">
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Báo cáo sự cố */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Báo cáo sự cố
              </h2>
              <button onClick={() => setReportModal(null)}><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Ô vườn: <span className="font-semibold text-green-700">{reportModal.slotNumber}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự cố / dịch vụ</label>
              <select 
                className="input" 
                value={serviceTypeId} 
                onChange={e => setServiceTypeId(Number(e.target.value))}
              >
                <option value={0} disabled>Chọn loại sự cố...</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.serviceName}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea 
                className="input min-h-[100px]" 
                placeholder="Mô tả sự cố bạn gặp phải (cây chết, cột hỏng, v.v.)..."
                value={reportDesc}
                onChange={e => setReportDesc(e.target.value)}
              />
            </div>

            {reportError && <div className="text-red-600 text-sm mb-3">{reportError}</div>}
            {reportSuccess && <div className="text-green-600 text-sm mb-3">{reportSuccess}</div>}

            <div className="flex justify-end gap-3">
              <button onClick={() => setReportModal(null)} disabled={reporting} className="btn-secondary">
                Đóng
              </button>
              <button 
                onClick={handleReportSubmit} 
                disabled={reporting || !serviceTypeId} 
                className="btn-primary"
              >
                {reporting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                {reporting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thuê thêm trụ */}
      {addPillarsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  Thuê thêm trụ khí canh
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ô vườn: <span className="font-semibold text-emerald-700">{addPillarsModal.slotNumber}</span>
                  {addPillarsModal.locationName ? ` · ${addPillarsModal.locationName}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setAddPillarsModal(null);
                  setAddPillarsError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin diện tích và thời hạn hợp đồng */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-0.5">Thời hạn hợp đồng còn lại</div>
                <div className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{previewData ? `${previewData.daysRemaining} ngày` : 'Đang tính...'}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Hết hạn: {addPillarsModal.endDate}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="text-xs text-emerald-700 mb-0.5">Diện tích ô còn trống</div>
                <div className="text-base font-bold text-emerald-800">
                  {previewData ? `${previewData.availableArea.toFixed(1)} m²` : 'Đang tính...'}
                  <span className="text-xs font-normal text-emerald-600 ml-1">/ {previewData?.slotTotalArea || (addPillarsModal.slotArea || 10)} m²</span>
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  Còn lại sau chọn:{' '}
                  <span className={clsx("font-semibold", (previewData?.remainingAreaAfter ?? 0) < 0 ? "text-red-600" : "text-emerald-700")}>
                    {previewData ? `${previewData.remainingAreaAfter.toFixed(1)} m²` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danh sách các loại trụ để chọn số lượng */}
            <div className="space-y-3 mb-4">
              <div className="text-sm font-semibold text-gray-800 flex items-center justify-between">
                <span>Chọn số lượng trụ muốn thuê thêm:</span>
                {previewLoading && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
                  </span>
                )}
              </div>

              {/* Trụ nhỏ */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-colors">
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>Trụ Nhỏ</span>
                    <span className="badge-green text-[10px] px-1.5 py-0.5">24 hốc · 1.0 m²</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    150.000 đ/tháng
                    {previewData && (
                      <span className="text-emerald-700 font-medium ml-1.5">
                        (~{Math.round(150000 * (previewData.daysRemaining / 30)).toLocaleString('vi-VN')} đ cho {previewData.daysRemaining} ngày)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSmallCount(Math.max(0, smallCount - 1))}
                    disabled={smallCount <= 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-gray-900">{smallCount}</span>
                  <button
                    type="button"
                    onClick={() => setSmallCount(smallCount + 1)}
                    disabled={previewData ? previewData.remainingAreaAfter < 1.0 : false}
                    className="w-8 h-8 rounded-lg border border-emerald-600 bg-emerald-50 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Trụ vừa */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-colors">
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>Trụ Vừa</span>
                    <span className="badge-green text-[10px] px-1.5 py-0.5">36 hốc · 1.5 m²</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    200.000 đ/tháng
                    {previewData && (
                      <span className="text-emerald-700 font-medium ml-1.5">
                        (~{Math.round(200000 * (previewData.daysRemaining / 30)).toLocaleString('vi-VN')} đ cho {previewData.daysRemaining} ngày)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMediumCount(Math.max(0, mediumCount - 1))}
                    disabled={mediumCount <= 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-gray-900">{mediumCount}</span>
                  <button
                    type="button"
                    onClick={() => setMediumCount(mediumCount + 1)}
                    disabled={previewData ? previewData.remainingAreaAfter < 1.5 : false}
                    className="w-8 h-8 rounded-lg border border-emerald-600 bg-emerald-50 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Trụ lớn */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-colors">
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>Trụ Lớn</span>
                    <span className="badge-green text-[10px] px-1.5 py-0.5">48 hốc · 2.0 m²</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    300.000 đ/tháng
                    {previewData && (
                      <span className="text-emerald-700 font-medium ml-1.5">
                        (~{Math.round(300000 * (previewData.daysRemaining / 30)).toLocaleString('vi-VN')} đ cho {previewData.daysRemaining} ngày)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLargeCount(Math.max(0, largeCount - 1))}
                    disabled={largeCount <= 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-gray-900">{largeCount}</span>
                  <button
                    type="button"
                    onClick={() => setLargeCount(largeCount + 1)}
                    disabled={previewData ? previewData.remainingAreaAfter < 2.0 : false}
                    className="w-8 h-8 rounded-lg border border-emerald-600 bg-emerald-50 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Khối tóm tắt chi phí pro-rated */}
            {previewData && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Tổng số trụ thuê thêm:</span>
                  <span className="font-semibold text-gray-900">{previewData.totalPillars} trụ</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Diện tích chiếm dụng:</span>
                  <span className="font-semibold text-gray-900">{previewData.requestedArea.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Đơn giá thuê trụ gốc:</span>
                  <span className="font-semibold text-gray-900">{previewData.monthlyPillarsPrice.toLocaleString('vi-VN')} đ/tháng</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-emerald-200/60">
                  <span>Tính theo thời hạn hợp đồng:</span>
                  <span className="font-medium text-gray-700">
                    {previewData.daysRemaining} ngày / 30 ngày = {(previewData.daysRemaining / 30).toFixed(2)} tháng
                  </span>
                </div>
                <div className="border-t border-emerald-200 pt-2.5 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tổng thanh toán pro-rated:</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {previewData.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            )}

            {/* Ghi chú quy trình sau thanh toán */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Quy trình thực hiện:</strong> Sau khi thanh toán thành công, hệ thống sẽ cấp phát trụ mới và tạo công việc lắp đặt cho nhân viên tại vườn. Bạn có thể vào mục <strong>"Trồng cây mới"</strong> để chọn loại rau/cây giống yêu thích trồng lên trụ.
              </div>
            </div>

            {addPillarsError && (
              <div className="text-red-600 text-sm mb-3 bg-red-50 p-2.5 rounded-lg border border-red-200">
                ⚠️ {addPillarsError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddPillarsModal(null);
                  setAddPillarsError('');
                }}
                disabled={addPillarsSubmitting}
                className="btn-secondary flex-1"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddPillarsSubmit}
                disabled={
                  addPillarsSubmitting ||
                  !previewData ||
                  !previewData.canAdd ||
                  smallCount + mediumCount + largeCount <= 0
                }
                className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {addPillarsSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo giao dịch...
                  </>
                ) : (
                  `Xác nhận & Thanh toán (${(previewData?.totalAmount ?? 0).toLocaleString('vi-VN')} đ)`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phóng to Ảnh bằng chứng / Cây thực tế */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent p-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Phóng to ảnh cây rau" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20 bg-gray-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Lỗi+tải+ảnh';
              }}
            />
            <div className="text-center mt-3">
              <a 
                href={previewImage} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Mở trong tab mới
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu cầu Thu hoạch sớm */}
      {earlyHarvestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !earlyHarvestSubmitting && setEarlyHarvestModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Yêu cầu thu hoạch sớm</h3>
                  <p className="text-xs text-gray-500">Ô {earlyHarvestModal.slotNumber} · {earlyHarvestModal.locationName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !earlyHarvestSubmitting && setEarlyHarvestModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Thông tin cây */}
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 space-y-1.5 text-xs text-amber-900">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cây trồng hiện tại:</span>
                  <span className="font-bold text-gray-900">{earlyHarvestModal.treeName || 'Cây trồng trên ô'}</span>
                </div>
                {earlyHarvestModal.plantedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày gieo trồng:</span>
                    <span className="font-medium text-gray-800">{new Date(earlyHarvestModal.plantedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                {earlyHarvestModal.expectedHarvestAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dự kiến chuẩn:</span>
                    <span className="font-medium text-gray-800">{new Date(earlyHarvestModal.expectedHarvestAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-amber-200/50 text-[11px] text-amber-700 leading-relaxed">
                  💡 Thu hoạch sớm sẽ hoàn tất chu kỳ phát triển của cây trên ô/trụ trước ngày thu hoạch chuẩn. Sau khi thu hoạch, trụ sẽ được dọn trống để bạn gieo trồng lứa cây mới.
                </div>
              </div>

              {/* Chọn trụ nếu có nhiều trụ */}
              {((earlyHarvestModal.pillars && earlyHarvestModal.pillars.length > 0) || earlyHarvestModal.pillarCodes) && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Chọn trụ muốn thu hoạch sớm:</span>
                    <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {earlyHarvestModal.pillars ? `${earlyHarvestModal.pillars.length} trụ trong ô` : ''}
                    </span>
                  </label>
                  <select
                    value={earlyHarvestPillar}
                    onChange={e => setEarlyHarvestPillar(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    <option value="">🌱 Tất cả các trụ đang canh tác trong ô</option>
                    {earlyHarvestModal.pillars && earlyHarvestModal.pillars.length > 0 ? (
                      earlyHarvestModal.pillars.map((p, idx) => {
                        const treeOnPillar = p.treeName || earlyHarvestModal.treeName;
                        return (
                          <option key={idx} value={p.pillarCode}>
                            Trụ {p.pillarCode} {treeOnPillar ? `(Đang trồng: ${treeOnPillar})` : `(${p.pillarType || 'Trụ khí canh'})`}
                          </option>
                        );
                      })
                    ) : earlyHarvestModal.pillarCodes ? (
                      earlyHarvestModal.pillarCodes.map((pCode, idx) => (
                        <option key={idx} value={pCode}>
                          Trụ {pCode} {earlyHarvestModal.treeName ? `(Đang trồng: ${earlyHarvestModal.treeName})` : ''}
                        </option>
                      ))
                    ) : null}
                  </select>
                </div>
              )}

              {/* Chọn hình thức thu hoạch */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hình thức thu hoạch:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setEarlyHarvestMethod('STAFF')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      earlyHarvestMethod === 'STAFF'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className={`w-4 h-4 ${earlyHarvestMethod === 'STAFF' ? 'text-emerald-600' : 'text-gray-300'}`} />
                      Nhờ nhân viên thu hoạch
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      Nhân viên ca trực sẽ thu hoạch, chụp ảnh nghiệm thu và liên hệ bàn giao rau sạch cho bạn.
                    </p>
                  </div>

                  <div
                    onClick={() => setEarlyHarvestMethod('SELF')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      earlyHarvestMethod === 'SELF'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <CheckCircle2 className={`w-4 h-4 ${earlyHarvestMethod === 'SELF' ? 'text-emerald-600' : 'text-gray-300'}`} />
                      Tôi tự thu hoạch
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      Bạn tự đến vườn thu hoạch trải nghiệm. Hệ thống lưu lịch sử và giải phóng trụ ngay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghi chú / lý do */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Ghi chú / Dặn dò gửi nhân viên:
                </label>
                <textarea
                  rows={3}
                  value={earlyHarvestNotes}
                  onChange={e => setEarlyHarvestNotes(e.target.value)}
                  placeholder="Ví dụ: Rau đã đạt kích thước mong muốn, nhờ nhân viên hái sáng mai và gửi bảo quản mát giúp tôi..."
                  className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {earlyHarvestError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">
                  ⚠️ {earlyHarvestError}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2.5 justify-end">
              <button
                type="button"
                disabled={earlyHarvestSubmitting}
                onClick={() => setEarlyHarvestModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={earlyHarvestSubmitting}
                onClick={handleEarlyHarvestSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-1.5 shadow-sm"
              >
                {earlyHarvestSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" /> Xác nhận thu hoạch sớm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thông Báo Thành Công Chuyên Nghiệp (Thay thế window.alert) */}
      {successModal.isOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {successModal.title}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {successModal.message}
            </p>

            {successModal.detail && (
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 mb-5 text-left text-xs text-gray-700">
                <span className="font-semibold text-gray-800">Thông tin chi tiết:</span> {successModal.detail}
              </div>
            )}

            <div className="flex gap-2.5">
              <Link
                to="/dashboard/customer/harvest-history"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-center gap-1.5"
              >
                <Sprout className="w-4 h-4" /> Xem lịch sử
              </Link>
              <button
                type="button"
                onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}