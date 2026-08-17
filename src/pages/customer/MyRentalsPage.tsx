import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, CreditCard, Calendar, Clock, Loader2, X, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
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

  const filtered = tab === 'all' ? rentals : rentals.filter(r => r.status === tab);

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
          <button key={t.key} onClick={() => setTab(t.key)}
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
          {filtered.map(rental => {
            const st = statusConfig[rental.status] || { label: rental.status, cls: 'badge-gray' };
            const pay = rental.paymentStatus ? paymentConfig[rental.paymentStatus] : null;
            return (
              <div key={rental.id} className="card">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{rental.slotNumber}</h3>
                    {rental.locationName && <div className="text-sm text-gray-500">{rental.locationName}</div>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={st.cls}>{st.label}</span>
                      {pay && <span className={pay.cls}>{pay.label}</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {rental.startDate} — {rental.endDate}
                    </div>
                    <div className="font-bold text-green-600 mt-1">{rental.totalPrice.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 h-fit">
                    {rental.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => { setExtendModal(rental); setExtendMonths(1); }}
                          className="btn-outline-green text-xs flex items-center gap-1 h-fit">
                          <Clock className="w-3.5 h-3.5" /> Gia hạn
                        </button>
                        <button onClick={() => setReportModal(rental)}
                          className="btn-outline-red text-xs flex items-center gap-1 h-fit mt-2 sm:mt-0">
                          <AlertTriangle className="w-3.5 h-3.5" /> Báo cáo sự cố
                        </button>
                      </>
                    )}
                    {(rental.status === 'PENDING' || rental.paymentStatus === 'PENDING') && rental.status !== 'CANCELLED' && (
                      <>
                        <button onClick={() => handlePay(rental)} disabled={payingId === rental.id}
                          className="btn-primary text-xs flex items-center gap-1 h-fit">
                          {payingId === rental.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CreditCard className="w-3.5 h-3.5" />}
                          Thanh toán
                        </button>
                        <button onClick={() => setCancelModal(rental)}
                          className="btn-outline-red text-xs flex items-center gap-1 h-fit">
                          <X className="w-3.5 h-3.5" /> Hủy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

            {extendError && <div className="text-red-600 text-sm mb-3">{extendError}</div>}
            <button
              onClick={handleExtend}
              disabled={extending || !extendMonths || extendMonths < 1 || Boolean(extendMonthsError)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extending ? 'Đang xử lý...' : 'Xác nhận & Thanh toán VNPay'}
            </button>
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
    </DashboardLayout>
  );
}
