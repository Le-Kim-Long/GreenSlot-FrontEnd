import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Loader2, RotateCw, ShoppingBag } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import { customerNavItems as navItems } from './customerNavItems';
import clsx from 'clsx';

// vnpTxnRef được BE sinh theo dạng "BOOK_<slotId>_<months>_<uuid>" (thuê mới)
// hoặc "EXT_<rentalId>_<months>_<uuid>" (gia hạn) — dùng tiền tố này để phân loại giao dịch.
function getTxnKind(vnpTxnRef: string): 'EXTEND' | 'BOOK' {
  return vnpTxnRef?.startsWith('EXT_') ? 'EXTEND' : 'BOOK';
}

function getExtendedMonths(vnpTxnRef: string): number | null {
  const parts = vnpTxnRef?.split('_');
  if (parts?.[0] !== 'EXT') return null;
  const months = Number(parts[2]);
  return Number.isFinite(months) ? months : null;
}

type FilterKind = 'ALL' | 'BOOK' | 'EXTEND';

export default function PaymentHistoryPage() {
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('ALL');

  useEffect(() => {
    bookingApi.getHistory()
      .then(setRentals)
      .finally(() => setLoading(false));
  }, []);

  const allTransactions = useMemo(() => rentals.flatMap(r =>
    (r.transactions ?? []).map(t => ({
      ...t,
      slotNumber: r.slotNumber,
      locationName: r.locationName,
      kind: getTxnKind(t.vnpTxnRef),
      extendedMonths: getExtendedMonths(t.vnpTxnRef),
    }))
  ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()), [rentals]);

  const transactions = filter === 'ALL' ? allTransactions : allTransactions.filter(t => t.kind === filter);
  const extendCount = allTransactions.filter(t => t.kind === 'EXTEND').length;

  const statusCls: Record<string, string> = {
    SUCCESS: 'badge-green',
    PAID: 'badge-green',
    PENDING: 'badge-yellow',
    FAILED: 'badge-red',
  };

  const filters: { key: FilterKind; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${allTransactions.length})` },
    { key: 'BOOK', label: `Thuê mới (${allTransactions.length - extendCount})` },
    { key: 'EXTEND', label: `Gia hạn (${extendCount})` },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thanh toán">
      <h2 className="text-2xl font-bold mb-4">Giao dịch thanh toán</h2>

      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === f.key
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-green-500/50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{filter === 'EXTEND' ? 'Bạn chưa gia hạn hợp đồng thuê nào' : 'Chưa có giao dịch nào'}</p>
          <Link to="/gardens" className="text-green-600 text-sm mt-2 block">Thuê ô vườn →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    t.kind === 'EXTEND' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-gray-100 text-gray-600'
                  )}>
                    {t.kind === 'EXTEND' ? <RotateCw className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {t.kind === 'EXTEND' ? `Gia hạn${t.extendedMonths ? ` +${t.extendedMonths} tháng` : ''}` : 'Thuê mới'}
                  </span>
                </div>
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
