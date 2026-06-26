import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

export default function PaymentHistoryPage() {
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.getHistory()
      .then(setRentals)
      .finally(() => setLoading(false));
  }, []);

  const transactions = rentals.flatMap(r =>
    (r.transactions ?? []).map(t => ({
      ...t,
      slotNumber: r.slotNumber,
      locationName: r.locationName,
    }))
  ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const statusCls: Record<string, string> = {
    SUCCESS: 'badge-green',
    PAID: 'badge-green',
    PENDING: 'badge-yellow',
    FAILED: 'badge-red',
  };

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thanh toán">
      <h2 className="text-2xl font-bold mb-6">Giao dịch thanh toán</h2>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có giao dịch nào</p>
          <Link to="/gardens" className="text-green-600 text-sm mt-2 block">Thuê ô vườn →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{Number(t.amount).toLocaleString('vi-VN')}đ</div>
                <div className="text-sm text-gray-500">{t.slotNumber} · {t.locationName}</div>
                <div className="text-xs text-gray-400">Ref: {t.vnpTxnRef}</div>
              </div>
              <div className="text-right">
                <span className={statusCls[t.status] || 'badge-gray'}>{t.status}</span>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(t.paymentDate).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
