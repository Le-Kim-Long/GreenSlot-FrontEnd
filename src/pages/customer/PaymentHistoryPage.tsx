import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, Loader2, RotateCw, ShoppingBag, Sprout, 
  Eye, Download, Printer, X, CheckCircle2, AlertCircle, 
  XCircle, Clock, MapPin, Calendar, FileText, Building2,
  Receipt, ShieldCheck
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import { customerNavItems as navItems } from './customerNavItems';
import type { PillarInfo, PaymentTransactionInfo } from '../../types/api';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';

// vnpTxnRef được BE sinh theo dạng "BOOK_<slotId>_<months>_<uuid>" (thuê mới),
// "EXT_<rentalId>_<months>_<uuid>" (gia hạn), hoặc "PLANT_<requestId>_<uuid>" (mua giống cây)
function getTxnKind(vnpTxnRef: string): 'EXTEND' | 'BOOK' | 'PLANT' {
  if (vnpTxnRef?.startsWith('EXT_')) return 'EXTEND';
  if (vnpTxnRef?.startsWith('PLANT_')) return 'PLANT';
  return 'BOOK';
}

function getExtendedMonths(vnpTxnRef: string): number | null {
  const parts = vnpTxnRef?.split('_');
  if (parts?.[0] !== 'EXT') return null;
  const months = Number(parts[2]);
  return Number.isFinite(months) ? months : null;
}

type FilterKind = 'ALL' | 'BOOK' | 'EXTEND' | 'PLANT';

interface DetailedTransaction extends PaymentTransactionInfo {
  rentalId?: number;
  slotNumber?: string;
  locationName?: string;
  locationAddress?: string;
  startDate?: string;
  endDate?: string;
  treeName?: string;
  pillarCodes?: string[];
  pillars?: PillarInfo[];
  monthlyPrice?: number;
  kind: 'EXTEND' | 'BOOK' | 'PLANT';
  extendedMonths: number | null;
}

export default function PaymentHistoryPage() {
  const [rentals, setRentals] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('ALL');
  const [selectedTxn, setSelectedTxn] = useState<DetailedTransaction | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const toast = useToast();

  useEffect(() => {
    bookingApi.getHistory()
      .then(setRentals)
      .finally(() => setLoading(false));
  }, []);

  const allTransactions: DetailedTransaction[] = useMemo(() => rentals.flatMap(r =>
    (r.transactions ?? []).map(t => ({
      ...t,
      rentalId: r.id,
      slotNumber: r.slotNumber,
      locationName: r.locationName,
      locationAddress: r.locationAddress,
      startDate: r.startDate || r.startTime,
      endDate: r.endDate || r.endTime,
      treeName: r.treeName,
      pillarCodes: r.pillarCodes,
      pillars: r.pillars,
      monthlyPrice: r.monthlyPrice,
      kind: getTxnKind(t.vnpTxnRef),
      extendedMonths: getExtendedMonths(t.vnpTxnRef),
    }))
  ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()), [rentals]);

  const transactions = filter === 'ALL' ? allTransactions : allTransactions.filter(t => t.kind === filter);
  const bookCount = allTransactions.filter(t => t.kind === 'BOOK').length;
  const extendCount = allTransactions.filter(t => t.kind === 'EXTEND').length;
  const plantCount = allTransactions.filter(t => t.kind === 'PLANT').length;

  const statusLabel: Record<string, { label: string; cls: string; icon: any }> = {
    SUCCESS: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PENDING: { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    FAILED: { label: 'Thanh toán thất bại', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  };

  const filters: { key: FilterKind; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${allTransactions.length})` },
    { key: 'BOOK', label: `Thuê mới (${bookCount})` },
    { key: 'EXTEND', label: `Gia hạn (${extendCount})` },
    { key: 'PLANT', label: `Mua giống rau (${plantCount})` },
  ];

  const handleDownloadPdf = async (txn: DetailedTransaction) => {
    setIsDownloadingPdf(true);
    try {
      const blob = await bookingApi.downloadPaymentInvoice(txn.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hoa_Don_GreenSlot_${txn.vnpTxnRef || txn.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tải hóa đơn PDF thành công!');
    } catch (err) {
      console.error('Lỗi tải hóa đơn:', err);
      toast.error('Không thể tải file PDF hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thanh toán">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-2">
                <CreditCard className="w-3.5 h-3.5 text-yellow-300" />
                Quản lý hóa đơn & giao dịch điện tử
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lịch sử thanh toán</h1>
              <p className="text-emerald-50 text-sm max-w-xl mt-1 leading-relaxed">
                Xem lại toàn bộ các giao dịch thuê ô vườn, gia hạn hợp đồng và mua phôi giống rau. Bấm vào từng giao dịch để xem chi tiết hóa đơn.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-right">
              <span className="text-xs text-emerald-100 block">Tổng số giao dịch</span>
              <span className="text-2xl font-black text-white">{allTransactions.length}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150',
                filter === f.key
                  ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-600/20'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-green-500 hover:bg-green-50/50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List of Transactions */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Đang tải lịch sử thanh toán...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 px-4 shadow-sm">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-600" />
            <p className="text-base font-semibold text-gray-700">
              {filter === 'EXTEND' 
                ? 'Bạn chưa có giao dịch gia hạn hợp đồng nào' 
                : filter === 'PLANT'
                ? 'Bạn chưa có giao dịch mua giống rau nào'
                : 'Chưa có giao dịch thanh toán nào'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Khi bạn thực hiện thuê ô vườn hoặc mua giống, các hóa đơn sẽ xuất hiện tại đây.</p>
            <Link to="/gardens" className="inline-flex items-center gap-1.5 text-green-600 font-semibold text-sm mt-4 hover:underline">
              <span>Khám phá & thuê ô vườn ngay</span> →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {transactions.map(t => {
              const status = statusLabel[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle };
              const StatusIcon = status.icon;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTxn(t)}
                  className="bg-white hover:bg-green-50/40 border border-gray-200/80 hover:border-green-300 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={clsx(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold transition-transform group-hover:scale-105",
                      t.kind === 'EXTEND' ? "bg-blue-100 text-blue-700" : t.kind === 'PLANT' ? "bg-emerald-100 text-emerald-700" : "bg-green-100 text-green-700"
                    )}>
                      {t.kind === 'EXTEND' ? <RotateCw className="w-5 h-5" /> : t.kind === 'PLANT' ? <Sprout className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                          t.kind === 'EXTEND' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : t.kind === 'PLANT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        )}>
                          {t.kind === 'EXTEND' 
                            ? `Gia hạn hợp đồng${t.extendedMonths ? ` (+${t.extendedMonths} tháng)` : ''}` 
                            : t.kind === 'PLANT'
                            ? 'Mua phôi giống rau'
                            : 'Thuê ô vườn mới'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          Mã: {t.vnpTxnRef}
                        </span>
                      </div>

                      <div className="text-lg font-bold text-gray-900">
                        {Number(t.amount).toLocaleString('vi-VN')} VNĐ
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-green-600" />
                          Ô {t.slotNumber}
                        </span>
                        {t.locationName && (
                          <span className="text-gray-500">· {t.locationName}</span>
                        )}
                        {t.treeName && (
                          <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                            🌱 {t.treeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border',
                        status.cls
                      )}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(t.paymentDate).toLocaleString('vi-VN')}
                    </div>

                    <div className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-green-600 group-hover:translate-x-0.5 transition-transform mt-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chi tiết hóa đơn →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 💥 MODAL CHI TIẾT HÓA ĐƠN & BIÊN LAI THANH TOÁN */}
        {selectedTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative max-h-[92vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-6 text-white relative">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="absolute top-5 right-5 text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-green-100 text-xs uppercase tracking-wider font-semibold mb-1">
                  <FileText className="w-4 h-4 text-yellow-300" />
                  Biên lai thanh toán điện tử
                </div>
                <h2 className="text-xl sm:text-2xl font-black">HÓA ĐƠN DỊCH VỤ GREENSLOT</h2>
                <p className="text-xs text-green-100 mt-0.5 font-mono">
                  Mã giao dịch: {selectedTxn.vnpTxnRef || `INV-${selectedTxn.id}`}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {/* Trạng thái & Tổng tiền */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 block">Số tiền thanh toán</span>
                    <span className="text-2xl font-black text-emerald-800">
                      {Number(selectedTxn.amount).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm',
                      statusLabel[selectedTxn.status]?.cls || 'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      {statusLabel[selectedTxn.status]?.icon && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {statusLabel[selectedTxn.status]?.label || selectedTxn.status}
                    </span>
                  </div>
                </div>

                {/* Thông tin giao dịch */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loại giao dịch:</span>
                    <span className="font-bold text-gray-900">
                      {selectedTxn.kind === 'EXTEND' 
                        ? `Gia hạn hợp đồng thuê (${selectedTxn.extendedMonths || 1} tháng)` 
                        : selectedTxn.kind === 'PLANT'
                        ? 'Mua phôi giống rau canh tác mới'
                        : 'Đăng ký thuê ô vườn mới'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Thời gian giao dịch:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(selectedTxn.paymentDate).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Cổng thanh toán:</span>
                    <span className="font-semibold text-blue-700">VNPay Gateway (ATM / QR Pay / Visa / Master)</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã đối soát VNPay:</span>
                    <span className="font-mono text-gray-800 font-semibold">{selectedTxn.vnpTxnRef}</span>
                  </div>
                </div>

                {/* 🧾 BẢNG KÊ CHI TIẾT CÁC KHOẢN PHÍ (ITEMIZED BREAKDOWN) */}
                {(() => {
                  const total = Number(selectedTxn.amount) || 0;
                  const pillarsCount = selectedTxn.pillars?.length || selectedTxn.pillarCodes?.length || 1;
                  
                  let months = selectedTxn.extendedMonths || 1;
                  if (selectedTxn.kind === 'BOOK' && selectedTxn.startDate && selectedTxn.endDate) {
                    const start = new Date(selectedTxn.startDate);
                    const end = new Date(selectedTxn.endDate);
                    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                    months = Math.max(1, Math.round(diffDays / 30));
                  }

                  const isPlantOnly = selectedTxn.kind === 'PLANT';
                  const slotPricePerMonth = isPlantOnly ? 0 : (selectedTxn.monthlyPrice || 500000);
                  const slotSubtotal = isPlantOnly ? 0 : Math.min(total, slotPricePerMonth * months);
                  const treeSubtotal = isPlantOnly ? total : Math.max(0, total - slotSubtotal);
                  const treePricePerPillar = treeSubtotal > 0 ? Math.round(treeSubtotal / Math.max(1, pillarsCount)) : 0;

                  return (
                    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-green-700 flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-green-600" /> Bảng kê chi tiết thanh toán (Itemized Breakdown)
                        </h3>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {selectedTxn.kind === 'EXTEND' ? 'Gia hạn' : selectedTxn.kind === 'PLANT' ? 'Phôi giống' : 'Thuê mới'}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-[11px] text-gray-400 font-semibold border-b border-gray-100">
                              <th className="pb-2">Khoản mục / Dịch vụ</th>
                              <th className="pb-2 text-right">Đơn giá</th>
                              <th className="pb-2 text-center">SL / Hạn</th>
                              <th className="pb-2 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {/* Dòng 1: Tiền thuê ô đất */}
                            {slotSubtotal > 0 && (
                              <tr>
                                <td className="py-2.5">
                                  <div className="font-bold text-gray-900 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Thuê ô vườn #{selectedTxn.slotNumber}</span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-0.5">
                                    {selectedTxn.kind === 'EXTEND' 
                                      ? `Phí gia hạn thời hạn hợp đồng (${months} tháng)` 
                                      : `Mặt bằng canh tác công nghệ cao (${pillarsCount} trụ)`}
                                  </div>
                                </td>
                                <td className="py-2.5 text-right font-mono text-gray-700">
                                  {slotPricePerMonth.toLocaleString('vi-VN')} đ/th
                                </td>
                                <td className="py-2.5 text-center text-gray-600 font-semibold">
                                  {months} tháng
                                </td>
                                <td className="py-2.5 text-right font-bold font-mono text-gray-900">
                                  {slotSubtotal.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            )}

                            {/* Dòng 2: Phôi giống cây trồng */}
                            {treeSubtotal > 0 && (
                              <tr>
                                <td className="py-2.5">
                                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                                    <span>🌱</span>
                                    <span>{selectedTxn.treeName || 'Phôi giống rau thủy canh'}</span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-0.5">
                                    Cung cấp giống chất lượng cao ({pillarsCount} trụ gieo trồng)
                                  </div>
                                </td>
                                <td className="py-2.5 text-right font-mono text-gray-700">
                                  {treePricePerPillar.toLocaleString('vi-VN')} đ/trụ
                                </td>
                                <td className="py-2.5 text-center text-gray-600 font-semibold">
                                  {pillarsCount} trụ
                                </td>
                                <td className="py-2.5 text-right font-bold font-mono text-emerald-700">
                                  {treeSubtotal.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            )}

                            {/* Dòng 3: Hệ thống châm phân & IoT tự động */}
                            <tr className="bg-gray-50/40">
                              <td className="py-2.5">
                                <div className="font-semibold text-gray-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Hệ thống IoT & Tưới tự động 24/7</span>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Cảm biến đo ẩm/pH/ánh sáng và điều khiển máy bơm tự động
                                </div>
                              </td>
                              <td className="py-2.5 text-right text-gray-400 font-mono">Đã bao gồm</td>
                              <td className="py-2.5 text-center text-gray-400">Toàn kỳ</td>
                              <td className="py-2.5 text-right font-semibold text-emerald-600 font-mono">
                                0 đ (Miễn phí)
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="border-t-2 border-gray-100 text-xs">
                            <tr>
                              <td colSpan={3} className="pt-3 text-right text-gray-500 font-medium">Tạm tính chi phí:</td>
                              <td className="pt-3 text-right font-mono font-semibold text-gray-800">
                                {total.toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="py-1 text-right text-gray-500 font-medium">Thuế GTGT / Phí nền tảng:</td>
                              <td className="py-1 text-right font-mono text-gray-500">0 đ (Đã bao gồm)</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                              <td colSpan={3} className="pt-2.5 text-right font-bold text-gray-900 text-sm">
                                Tổng thanh toán thực tế (VNPay):
                              </td>
                              <td className="pt-2.5 text-right font-black font-mono text-emerald-800 text-base">
                                {total.toLocaleString('vi-VN')} VNĐ
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Thông tin Ô vườn & Hợp đồng */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5 text-xs">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-green-700 flex items-center gap-1.5 pb-1 border-b border-gray-100">
                    <Building2 className="w-4 h-4" /> Thông tin ô vườn & canh tác
                  </h3>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Vị trí ô đất:</span>
                    <span className="font-bold text-gray-900">Ô {selectedTxn.slotNumber} (HĐ #{selectedTxn.rentalId})</span>
                  </div>

                  {selectedTxn.locationName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cơ sở nhà vườn:</span>
                      <span className="font-medium text-gray-800 text-right">{selectedTxn.locationName}</span>
                    </div>
                  )}

                  {selectedTxn.locationAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Địa chỉ cơ sở:</span>
                      <span className="font-medium text-gray-600 text-right max-w-xs">{selectedTxn.locationAddress}</span>
                    </div>
                  )}

                  {selectedTxn.treeName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Giống cây đăng ký:</span>
                      <span className="font-bold text-emerald-700">🌱 {selectedTxn.treeName}</span>
                    </div>
                  )}

                  {selectedTxn.pillars && selectedTxn.pillars.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500">Các trụ canh tác:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {selectedTxn.pillars.map((p, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200">
                            {p.pillarCode} ({p.capacityHoles || 24} hốc)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTxn.startDate && selectedTxn.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Thời hạn hợp đồng:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(selectedTxn.startDate).toLocaleDateString('vi-VN')} → {new Date(selectedTxn.endDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(selectedTxn)}
                    disabled={isDownloadingPdf}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Tải PDF hóa đơn</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-500" />
                    <span>In hóa đơn</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
