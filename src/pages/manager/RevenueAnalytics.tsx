import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, User, Hash, CreditCard, MapPin, PieChart as PieIcon, FileSpreadsheet, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi, RevenueAnalyticsResponse, RevenueByLocationItem, TransactionDeclarationItem } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#d97706', '#0891b2', '#0d9488', '#e11d48'];

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null);
  const [locationData, setLocationData] = useState<RevenueByLocationItem[]>([]);
  const [declarations, setDeclarations] = useState<TransactionDeclarationItem[]>([]);
  
  // 👉 State chuyển tab giữa "Giao dịch thường" và "Kê khai thuế"
  const [activeTab, setActiveTab] = useState<'normal' | 'declarations'>('normal');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

  // 💥 Tự động gọi song song 3 API cùng lúc
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [revenueResult, locationResult, declarationsResult] = await Promise.all([
        managerApi.getRevenue(startDate, endDate),
        managerApi.getRevenueByLocation(startDate, endDate),
        managerApi.getTransactionDeclarations(startDate, endDate),
      ]);
      setData(revenueResult);
      setLocationData(locationResult);
      setDeclarations(declarationsResult);
    } catch (err) {
      console.error('Lỗi tải dữ liệu doanh thu:', err);
      setError('Không thể tải dữ liệu phân tích doanh thu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatDateTime = (dateString?: string) => {
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
  };

  // 💥 Tính năng bổ sung: Xuất dữ liệu Kê khai thuế ra file CSV / Excel để nộp báo cáo
  const handleExportCSV = () => {
    if (!declarations || declarations.length === 0) return;
    const headers = ['ID,Rental ID,Khu vườn,Mã Trụ,Vị trí,Tên khách hàng,Tên đăng nhập,Mã GD,Phương thức,Số tiền,Thời gian,Trạng thái,Mô tả'];
    const rows = declarations.map(item => [
      item.id,
      item.rentalId,
      `"${item.locationName || ''}"`,
      item.pillarCode || '',
      item.slotNumber || '',
      `"${item.customerName || ''}"`,
      item.customerUsername || '',
      item.transactionCode || '',
      item.paymentMethod || '',
      item.amount || 0,
      `"${formatDateTime(item.paymentDate)}"`,
      item.status || '',
      `"${item.description || ''}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ke-khai-thue-${startDate}-den-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout navItems={staffNavItems} title="Phân tích Doanh thu & Kê khai">
      {/* Bộ lọc ngày tháng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">Thời gian:</span>
          <input
            type="date"
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-400 font-bold">—</span>
          <input
            type="date"
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Đang tổng hợp số liệu doanh thu & kê khai thuế...</p>
        </div>
      ) : data ? (
        <>
          {/* Thẻ Thống Kê Tổng Quan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng doanh thu</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">
                    {(data.totalRevenue || 0).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số giao dịch</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">
                    {data.transactions?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngày có doanh thu</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">
                    {data.dailyBreakdown?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Khu Vực Biểu Đồ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Doanh thu theo ngày</h3>
              {data.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailyBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <DollarSign className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Chưa phát sinh doanh thu theo ngày</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 text-lg">Tỷ trọng Cơ sở</h3>
              </div>
              {locationData && locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={locationData}
                      dataKey="totalRevenue"
                      nameKey="locationName"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {locationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs font-semibold text-gray-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <MapPin className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm text-center">Chưa có dữ liệu cơ sở</p>
                </div>
              )}
            </div>
          </div>

          {/* Bảng Doanh thu theo cơ sở */}
          {locationData && locationData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Doanh thu chi tiết từng Khu vườn / Cơ sở
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Tên Cơ sở / Khu vườn</th>
                      <th className="p-4 text-center">Số Giao dịch</th>
                      <th className="p-4 text-right">Tổng Doanh thu</th>
                      <th className="p-4 text-right">Trung bình / Giao dịch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {locationData.map((loc, idx) => {
                      const avg = loc.transactionCount > 0 ? loc.totalRevenue / loc.transactionCount : 0;
                      return (
                        <tr key={loc.locationId} className="hover:bg-gray-50/80 transition">
                          <td className="p-4 font-bold text-gray-400">#{loc.locationId}</td>
                          <td className="p-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              <span>{loc.locationName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-semibold text-gray-700">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">
                              {loc.transactionCount}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-green-600 text-base">
                            {(loc.totalRevenue || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-4 text-right font-medium text-gray-500 text-xs">
                            {avg.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 💥 KHU VỰC QUẢN LÝ GIAO DỊCH & KÊ KHAI THUẾ (HỆ THỐNG TAB) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Tab Navigation Buttons */}
              <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('normal')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2",
                    activeTab === 'normal' ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Giao dịch thường ({data.transactions?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('declarations')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2",
                    activeTab === 'declarations' ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Báo cáo Kê khai thuế ({declarations?.length || 0})</span>
                </button>
              </div>

              {/* Nút tải Excel / CSV chỉ hiện khi ở tab Kê Khai Thuế */}
              {activeTab === 'declarations' && declarations?.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Excel / CSV báo cáo</span>
                </button>
              )}
            </div>

            {/* TAB 1: Bảng Giao Dịch Thường */}
            {activeTab === 'normal' && (
              <div className="overflow-x-auto">
                {data.transactions && data.transactions.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Khách hàng</th>
                        <th className="p-4">Mã thuê & Vị trí</th>
                        <th className="p-4">Mã VNPAY</th>
                        <th className="p-4">Thời gian thanh toán</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-4 font-bold text-gray-900">
                            <span className="inline-flex items-center gap-1">
                              <Hash className="w-3.5 h-3.5 text-gray-400" />
                              {t.id}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-gray-700">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="w-4 h-4 text-green-600 shrink-0" />
                              {t.customerUsername || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-800">Rental #{t.rentalId}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Vị trí: {t.slotNumber || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-gray-600 font-mono text-xs">
                            <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md border border-gray-200/60">
                              <CreditCard className="w-3 h-3 text-gray-500" />
                              {t.vnpTxnRef || '-'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 text-xs font-medium">
                            {formatDateTime(t.paymentDate)}
                          </td>
                          <td className="p-4">
                            <span
                              className={clsx(
                                'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                                t.status?.toUpperCase() === 'SUCCESS' || t.status?.toUpperCase() === 'COMPLETED' || t.status?.toUpperCase() === 'PAID'
                                  ? 'bg-green-100 text-green-700 border border-green-200/50'
                                  : t.status?.toUpperCase() === 'PENDING'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200/50'
                              )}
                            >
                              {t.status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-green-600 text-base">
                            {(t.amount || 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-400 font-medium">Chưa có dữ liệu giao dịch thường</div>
                )}
              </div>
            )}

            {/* TAB 2: Bảng Báo Cáo Kê Khai Thuế / Chi Tiết (Declarations) */}
            {activeTab === 'declarations' && (
              <div className="overflow-x-auto">
                {declarations && declarations.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-green-50/60 border-b border-gray-100 text-xs font-bold text-green-800 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Mã GD / Trụ</th>
                        <th className="p-4">Khách hàng</th>
                        <th className="p-4">Khu vườn & Vị trí</th>
                        <th className="p-4">Phương thức</th>
                        <th className="p-4">Mô tả giao dịch</th>
                        <th className="p-4">Thời gian</th>
                        <th className="p-4 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {declarations.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-4">
                            <div className="font-bold text-gray-900 font-mono text-xs">{d.transactionCode || `#${d.id}`}</div>
                            <div className="text-xs text-green-700 font-semibold mt-0.5">Trụ: {d.pillarCode || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{d.customerName || d.customerUsername || 'Khách vãng lai'}</div>
                            <div className="text-xs text-gray-400 mt-0.5">({d.customerUsername || 'N/A'})</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-800">{d.locationName || 'N/A'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Rental #{d.rentalId} — Vị trí: {d.slotNumber || '-'}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-200/50">
                              <CreditCard className="w-3 h-3" />
                              {d.paymentMethod || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 text-xs max-w-xs truncate" title={d.description}>
                            {d.description || 'Thanh toán tiền thuê đất / dịch vụ'}
                          </td>
                          <td className="p-4 text-gray-600 text-xs font-medium whitespace-nowrap">
                            {formatDateTime(d.paymentDate)}
                          </td>
                          <td className="p-4 text-right font-black text-green-600 text-base whitespace-nowrap">
                            {(d.amount || 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-400 font-medium">Chưa có dữ liệu báo cáo kê khai thuế trong khoảng thời gian này</div>
                )}
              </div>
            )}

          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}