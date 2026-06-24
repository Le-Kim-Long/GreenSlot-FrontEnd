import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Plus, Calendar, Clock, Loader2, X } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang thuê', cls: 'badge-green' },
  PENDING: { label: 'Chờ xác nhận', cls: 'badge-yellow' },
  COMPLETED: { label: 'Đã hoàn thành', cls: 'badge-gray' },
  CANCELLED: { label: 'Đã hủy', cls: 'badge-red' },
  EXPIRED: { label: 'Hết hạn', cls: 'badge-gray' },
};

const paymentConfig: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Đã thanh toán', cls: 'badge-green' },
  UNPAID: { label: 'Chưa thanh toán', cls: 'badge-red' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'badge-blue' },
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const [extendModal, setExtendModal] = useState<BookingHistory | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    bookingApi.getHistory()
      .then(data => setRentals(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải lịch sử thuê'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = tab === 'all' ? rentals : rentals.filter(r => r.status === tab);

  const tabs = [
    { key: 'all', label: 'Tất cả', count: rentals.length },
    { key: 'ACTIVE', label: 'Đang thuê', count: rentals.filter(r => r.status === 'ACTIVE').length },
    { key: 'PENDING', label: 'Chờ xác nhận', count: rentals.filter(r => r.status === 'PENDING').length },
    { key: 'COMPLETED', label: 'Đã hoàn thành', count: rentals.filter(r => r.status === 'COMPLETED').length },
  ];

  const handleExtend = async () => {
    if (!extendModal) return;
    setExtending(true);
    setExtendError('');
    try {
      const result = await bookingApi.extendBooking({
        bookingId: extendModal.id,
        additionalMonths: extendMonths,
      });
      if (typeof result === 'string' && result.startsWith('http')) {
        window.location.href = result;
      } else {
        setExtendModal(null);
        fetchHistory();
      }
    } catch (err: any) {
      setExtendError(err?.response?.data?.message || 'Gia hạn thất bại. Vui lòng thử lại.');
    } finally {
      setExtending(false);
    }
  };

  const getStatus = (status: string) => statusConfig[status] || { label: status, cls: 'badge-gray' };
  const getPayment = (status?: string) => {
    if (!status) return null;
    return paymentConfig[status] || { label: status, cls: 'badge-gray' };
  };

  return (
    <DashboardLayout navItems={navItems} title="Vườn đang thuê">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý thuê vườn</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tất cả ô vườn bạn đang và đã thuê</p>
        </div>
        <Link to="/gardens" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Thuê thêm
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', tab === t.key ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn thuê nào</h3>
          <p className="text-gray-500 text-sm mb-6">Hãy khám phá và thuê ô vườn ngay!</p>
          <Link to="/gardens" className="btn-primary inline-flex">Khám phá vườn</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rental => {
            const st = getStatus(rental.status);
            const pay = getPayment(rental.paymentStatus);
            return (
              <div key={rental.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{rental.slotNumber}</h3>
                        {rental.locationName && (
                          <div className="text-sm text-gray-500 mt-0.5">{rental.locationName}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={st.cls}>{st.label}</span>
                        {pay && <span className={pay.cls}>{pay.label}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rental.startDate} — {rental.endDate}
                      </span>
                      <span className="font-bold text-green-600">
                        {rental.totalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {rental.status === 'ACTIVE' && (
                      <button onClick={() => { setExtendModal(rental); setExtendMonths(1); setExtendError(''); }}
                        className="btn-outline-green text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Gia hạn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extend modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Gia hạn hợp đồng</h2>
              <button onClick={() => setExtendModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ô vườn</span>
                <span className="font-medium">{extendModal.slotNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hết hạn hiện tại</span>
                <span className="font-medium">{extendModal.endDate}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Số tháng gia hạn</label>
              <select className="input" value={extendMonths} onChange={e => setExtendMonths(Number(e.target.value))}>
                {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
              </select>
            </div>

            {extendError && (
              <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm mb-3">{extendError}</div>
            )}

            <div className="space-y-2">
              <button onClick={handleExtend} disabled={extending} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {extending ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : 'Xác nhận gia hạn'}
              </button>
              <button onClick={() => setExtendModal(null)} disabled={extending} className="btn-secondary w-full py-2.5">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
