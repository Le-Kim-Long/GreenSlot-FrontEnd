import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Calendar, Clock, Loader2, X } from 'lucide-react';
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
  SUCCESS: { label: 'Đã thanh toán', cls: 'badge-green' },
  PAID: { label: 'Đã thanh toán', cls: 'badge-green' },
  PENDING: { label: 'Chờ thanh toán', cls: 'badge-yellow' },
  FAILED: { label: 'Thất bại', cls: 'badge-red' },
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
                  {rental.status === 'ACTIVE' && (
                    <button onClick={() => { setExtendModal(rental); setExtendMonths(1); }}
                      className="btn-outline-green text-xs flex items-center gap-1 h-fit">
                      <Clock className="w-3.5 h-3.5" /> Gia hạn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {extendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-5">
              <h2 className="text-xl font-bold">Gia hạn hợp đồng</h2>
              <button onClick={() => setExtendModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <select className="input mb-4" value={extendMonths} onChange={e => setExtendMonths(Number(e.target.value))}>
              {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
            </select>
            {extendError && <div className="text-red-600 text-sm mb-3">{extendError}</div>}
            <button onClick={handleExtend} disabled={extending} className="btn-primary w-full">
              {extending ? 'Đang xử lý...' : 'Xác nhận & Thanh toán VNPay'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
