import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  MapPin,
  PieChart as PieIcon,
  FileSpreadsheet,
  Hash,
  Users,
  User,
  Search,
  Copy,
  Check,
  X,
  Sprout,
  Clock,
  Phone,
  Mail,
  Receipt,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import {
  managerApi,
  RevenueAnalyticsResponse,
  RevenueByLocationItem,
  TransactionDeclarationItem,
} from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#d97706', '#0891b2', '#0d9488', '#e11d48'];

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null);
  const [locationData, setLocationData] = useState<RevenueByLocationItem[]>([]);
  const [declarations, setDeclarations] = useState<TransactionDeclarationItem[]>([]);
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState<'TRANSACTIONS' | 'CUSTOMERS'>('TRANSACTIONS');

  // Pagination
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const [custPage, setCustPage] = useState(1);
  const [custPageSize, setCustPageSize] = useState(10);

  // Modal detail
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionDeclarationItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

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

  const formatPaymentMethod = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'VNPAY':
        return 'VNPAY Online';
      case 'CASH':
        return 'Tiền mặt';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản';
      case 'QR_CODE':
        return 'Quét mã QR';
      default:
        return method || 'VNPAY Online';
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Danh sách cơ sở để lọc
  const locationOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...locationData.map((loc) => loc.locationName),
        ...declarations.map((d) => d.locationName),
      ].filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [locationData, declarations]);

  // Danh sách khách hàng để lọc
  const customerOptions = useMemo(() => {
    const customerMap = new Map<string, string>();
    declarations.forEach((d) => {
      if (d.customerUsername) {
        customerMap.set(d.customerUsername, d.customerName || d.customerUsername);
      }
    });
    return Array.from(customerMap.entries())
      .map(([username, name]) => ({ username, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [declarations]);

  // Lọc giao dịch và sắp xếp mới nhất lên đầu
  const filteredDeclarations = useMemo(() => {
    return declarations
      .filter((d) => {
        if (selectedLocation && d.locationName !== selectedLocation) return false;
        if (selectedCustomer && d.customerUsername !== selectedCustomer) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const codeMatch = (d.transactionCode || '').toLowerCase().includes(query);
          const refMatch = (d.vnpTxnRef || '').toLowerCase().includes(query);
          const nameMatch = (d.customerName || '').toLowerCase().includes(query);
          const userMatch = (d.customerUsername || '').toLowerCase().includes(query);
          const slotMatch = (d.slotNumber || '').toLowerCase().includes(query);
          const pillarMatch = (d.pillarCode || '').toLowerCase().includes(query);
          if (!codeMatch && !refMatch && !nameMatch && !userMatch && !slotMatch && !pillarMatch) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.paymentDate || 0).getTime();
        const timeB = new Date(b.paymentDate || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [declarations, selectedLocation, selectedCustomer, searchQuery]);

  // Tính tổng hợp doanh thu theo từng khách hàng
  const customerBreakdowns = useMemo(() => {
    const map = new Map<
      string,
      {
        username: string;
        fullName: string;
        email?: string;
        phone?: string;
        transactionCount: number;
        totalAmount: number;
        locations: Set<string>;
        slots: Set<string>;
        latestPaymentDate: string;
      }
    >();

    declarations.forEach((d) => {
      const key = d.customerUsername || 'anonymous';
      const existing = map.get(key);
      if (existing) {
        existing.transactionCount += 1;
        existing.totalAmount += d.amount || 0;
        if (d.locationName) existing.locations.add(d.locationName);
        if (d.slotNumber) existing.slots.add(d.slotNumber);
        if (d.customerEmail && !existing.email) existing.email = d.customerEmail;
        if (d.customerPhone && !existing.phone) existing.phone = d.customerPhone;
        if (d.paymentDate && (!existing.latestPaymentDate || d.paymentDate > existing.latestPaymentDate)) {
          existing.latestPaymentDate = d.paymentDate;
        }
      } else {
        const locs = new Set<string>();
        if (d.locationName) locs.add(d.locationName);
        const slts = new Set<string>();
        if (d.slotNumber) slts.add(d.slotNumber);
        map.set(key, {
          username: d.customerUsername || 'Khách vãng lai',
          fullName: d.customerName || d.customerUsername || 'Khách vãng lai',
          email: d.customerEmail,
          phone: d.customerPhone,
          transactionCount: 1,
          totalAmount: d.amount || 0,
          locations: locs,
          slots: slts,
          latestPaymentDate: d.paymentDate,
        });
      }
    });

    let list = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    if (selectedCustomer) {
      list = list.filter((c) => c.username === selectedCustomer);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.fullName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q));
    }
    return list;
  }, [declarations, selectedCustomer, searchQuery]);

  const filteredTotalRevenue = useMemo(() => {
    return filteredDeclarations.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredDeclarations]);

  // Transactions Pagination
  const totalTxPages = Math.ceil(filteredDeclarations.length / txPageSize) || 1;
  const paginatedDeclarations = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return filteredDeclarations.slice(start, start + txPageSize);
  }, [filteredDeclarations, txPage, txPageSize]);

  // Customers Pagination
  const totalCustPages = Math.ceil(customerBreakdowns.length / custPageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (custPage - 1) * custPageSize;
    return customerBreakdowns.slice(start, start + custPageSize);
  }, [customerBreakdowns, custPage, custPageSize]);

  return (
    <DashboardLayout navItems={staffNavItems} title="Phân tích Doanh thu & Kê khai">
      {/* Bộ lọc thanh công cụ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Bộ lọc ngày tháng */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">Thời gian:</span>
          <input
            type="date"
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setTxPage(1);
              setCustPage(1);
            }}
          />
          <span className="text-gray-400 font-bold">—</span>
          <input
            type="date"
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setTxPage(1);
              setCustPage(1);
            }}
          />
        </div>

        {/* Bộ lọc cơ sở & khách hàng */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-green-600 shrink-0" />
            <select
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white font-medium"
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setTxPage(1);
                setCustPage(1);
              }}
            >
              <option value="">Tất cả cơ sở</option>
              {locationOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <select
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition bg-white font-medium"
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setTxPage(1);
                setCustPage(1);
              }}
            >
              <option value="">Tất cả khách hàng ({customerOptions.length})</option>
              {customerOptions.map((c) => (
                <option key={c.username} value={c.username}>
                  {c.name} ({c.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-semibold text-sm">Đang tải và đồng bộ dữ liệu giao dịch...</p>
        </div>
      ) : data ? (
        <>
          {/* Thẻ Thống kê Tổng quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between opacity-85 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Tổng Doanh Thu</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-2xl lg:text-3xl font-black">
                {(filteredTotalRevenue || 0).toLocaleString('vi-VN')}đ
              </div>
              <p className="text-xs text-green-100 mt-2 font-medium">
                {selectedLocation || selectedCustomer
                  ? 'Theo bộ lọc đang chọn'
                  : 'Trong khoảng thời gian đã chọn'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Tổng Giao Dịch</span>
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {filteredDeclarations.length}
              </div>
              <p className="text-xs text-gray-400 mt-2">Giao dịch đã thanh toán thành công</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Khách Hàng Phát Sinh</span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-purple-600">
                {customerBreakdowns.length}
              </div>
              <p className="text-xs text-gray-400 mt-2">Khách hàng có giao dịch</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">TB Mỗi Giao Dịch</span>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-amber-600">
                {filteredDeclarations.length > 0
                  ? Math.round(filteredTotalRevenue / filteredDeclarations.length).toLocaleString('vi-VN')
                  : 0}đ
              </div>
              <p className="text-xs text-gray-400 mt-2">Giá trị trung bình 1 đơn thuê</p>
            </div>
          </div>

          {/* Biểu đồ phân tích */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Biểu đồ doanh thu theo ngày */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Biểu đồ biến động doanh thu theo ngày
              </h3>
              {data.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailyBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#888888"
                      tickFormatter={(val) => {
                        const parts = val.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#888888"
                      tickFormatter={(val) => `${(val / 1000).toLocaleString('vi-VN')}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <FileSpreadsheet className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Không có dữ liệu trong khoảng thời gian này</p>
                </div>
              )}
            </div>

            {/* Biểu đồ tròn cơ sở */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2 self-start">
                <PieIcon className="w-5 h-5 text-green-600" />
                Tỷ trọng theo Cơ sở
              </h3>
              {locationData && locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={locationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="totalRevenue"
                      nameKey="locationName"
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
          {locationData && locationData.length > 0 && !selectedLocation && (
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

          {/* TAB CHUYỂN ĐỔI: "Lịch sử giao dịch chi tiết" & "Doanh thu theo từng Khách hàng" */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewTab('TRANSACTIONS')}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                    viewTab === 'TRANSACTIONS'
                      ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-600/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Lịch sử giao dịch ({filteredDeclarations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('CUSTOMERS')}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                    viewTab === 'CUSTOMERS'
                      ? 'bg-green-600 text-white shadow-sm ring-2 ring-green-600/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Users className="w-4 h-4" />
                  Doanh thu theo Khách hàng ({customerBreakdowns.length})
                </button>
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    viewTab === 'TRANSACTIONS'
                      ? 'Tìm theo mã GD, tên, ô, trụ...'
                      : 'Tìm theo tên, username khách...'
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setTxPage(1);
                    setCustPage(1);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTxPage(1);
                      setCustPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: BẢNG LỊCH SỬ GIAO DỊCH */}
            {viewTab === 'TRANSACTIONS' && (
              <div>
                <div className="overflow-x-auto">
                  {filteredDeclarations && filteredDeclarations.length > 0 ? (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-green-50/60 border-b border-gray-100 text-xs font-bold text-green-800 uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Mã GD VNPay</th>
                          <th className="p-4">Khách hàng</th>
                          <th className="p-4">Cơ sở & Ô / Trụ</th>
                          <th className="p-4">Giống cây & Thời hạn</th>
                          <th className="p-4">Phương thức</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4">Thời gian</th>
                          <th className="p-4 text-right">Số tiền</th>
                          <th className="p-4 text-center">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedDeclarations.map((d) => (
                          <tr
                            key={d.id}
                            onClick={() => setSelectedTxDetail(d)}
                            className="hover:bg-green-50/40 transition cursor-pointer group"
                          >
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 bg-gray-100 group-hover:bg-green-100 group-hover:text-green-900 px-2.5 py-1 rounded-md border border-gray-200/60 font-mono text-xs font-bold text-gray-900 transition">
                                <Hash className="w-3 h-3 text-gray-500" />
                                {d.transactionCode || `#${d.id}`}
                              </span>
                              {d.vnpTxnRef && (
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5" title="Mã đơn hàng">
                                  {d.vnpTxnRef}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-900 group-hover:text-green-700 transition">
                                {d.customerName || d.customerUsername || 'Khách vãng lai'}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">@{d.customerUsername || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-gray-800">{d.locationName || 'N/A'}</div>
                              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                                {d.pillarCode && d.pillarCode !== 'N/A' ? `Trụ: ${d.pillarCode}` : `Ô: ${d.slotNumber || '-'}`}
                              </div>
                              <div className="text-[11px] text-gray-400">Rental #{d.rentalId}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-teal-800 text-xs flex items-center gap-1">
                                <Sprout className="w-3.5 h-3.5 text-teal-600" />
                                {d.treeName || 'Chưa chọn giống cây'}
                              </div>
                              {d.durationMonths && (
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  Thuê {d.durationMonths} tháng
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-200/50">
                                <CreditCard className="w-3 h-3" />
                                {formatPaymentMethod(d.paymentMethod)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={clsx(
                                  'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                                  d.status?.toUpperCase() === 'SUCCESS' ||
                                    d.status?.toUpperCase() === 'COMPLETED' ||
                                    d.status?.toUpperCase() === 'PAID'
                                    ? 'bg-green-100 text-green-700 border border-green-200/50'
                                    : d.status?.toUpperCase() === 'PENDING'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                    : 'bg-rose-100 text-rose-700 border border-rose-200/50'
                                )}
                              >
                                {d.status?.toUpperCase() === 'SUCCESS' || d.status?.toUpperCase() === 'COMPLETED' || d.status?.toUpperCase() === 'PAID'
                                  ? 'Thành công'
                                  : d.status?.toUpperCase() === 'PENDING'
                                  ? 'Chờ thanh toán'
                                  : 'Thất bại'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600 text-xs font-medium whitespace-nowrap">
                              {formatDateTime(d.paymentDate)}
                            </td>
                            <td className="p-4 text-right font-black text-green-600 text-base whitespace-nowrap">
                              {(d.amount || 0).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTxDetail(d);
                                }}
                                className="p-1.5 hover:bg-green-100 text-green-700 rounded-lg transition"
                                title="Xem chi tiết"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-gray-400 font-medium">
                      {selectedLocation || selectedCustomer || searchQuery
                        ? 'Không tìm thấy giao dịch nào phù hợp với bộ lọc'
                        : 'Chưa có dữ liệu lịch sử giao dịch trong khoảng thời gian này'}
                    </div>
                  )}
                </div>

                {filteredDeclarations.length > 0 && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Pagination
                      currentPage={txPage}
                      totalPages={totalTxPages}
                      totalItems={filteredDeclarations.length}
                      pageSize={txPageSize}
                      onPageChange={setTxPage}
                      onPageSizeChange={(sz) => {
                        setTxPageSize(sz);
                        setTxPage(1);
                      }}
                      itemName="giao dịch"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BẢNG DOANH THU THEO TỪNG KHÁCH HÀNG */}
            {viewTab === 'CUSTOMERS' && (
              <div>
                <div className="overflow-x-auto">
                  {customerBreakdowns && customerBreakdowns.length > 0 ? (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-green-50/60 border-b border-gray-100 text-xs font-bold text-green-800 uppercase tracking-wider">
                        <tr>
                          <th className="p-4">#</th>
                          <th className="p-4">Khách hàng</th>
                          <th className="p-4">Thông tin liên hệ</th>
                          <th className="p-4 text-center">Số giao dịch</th>
                          <th className="p-4">Khu vườn & Ô đã thuê</th>
                          <th className="p-4">Giao dịch gần nhất</th>
                          <th className="p-4 text-right">Tổng chi tiêu</th>
                          <th className="p-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedCustomers.map((c, idx) => (
                          <tr key={c.username} className="hover:bg-green-50/30 transition">
                            <td className="p-4 font-bold text-gray-400">#{(custPage - 1) * custPageSize + idx + 1}</td>
                            <td className="p-4">
                              <div className="font-bold text-gray-900 text-base">{c.fullName}</div>
                              <div className="text-xs text-gray-400 mt-0.5">@{c.username}</div>
                            </td>
                            <td className="p-4 text-xs space-y-1">
                              {c.email && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span>{c.email}</span>
                                </div>
                              )}
                              {c.phone && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>{c.phone}</span>
                                </div>
                              )}
                              {!c.email && !c.phone && <span className="text-gray-400 italic">Chưa cập nhật</span>}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-block bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs">
                                {c.transactionCount} đơn
                              </span>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="font-semibold text-gray-800">
                                {Array.from(c.locations).join(', ') || 'N/A'}
                              </div>
                              <div className="text-gray-500 mt-0.5">
                                {Array.from(c.slots).map((s) => `Ô ${s}`).join(', ') || '-'}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                              {formatDateTime(c.latestPaymentDate)}
                            </td>
                            <td className="p-4 text-right font-black text-green-600 text-base whitespace-nowrap">
                              {c.totalAmount.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c.username);
                                  setViewTab('TRANSACTIONS');
                                  setTxPage(1);
                                }}
                                className="btn-outline-green text-xs py-1.5 px-3 whitespace-nowrap"
                              >
                                Xem {c.transactionCount} giao dịch
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-gray-400 font-medium">
                      Không tìm thấy dữ liệu khách hàng phù hợp
                    </div>
                  )}
                </div>

                {customerBreakdowns.length > 0 && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Pagination
                      currentPage={custPage}
                      totalPages={totalCustPages}
                      totalItems={customerBreakdowns.length}
                      pageSize={custPageSize}
                      onPageChange={setCustPage}
                      onPageSizeChange={(sz) => {
                        setCustPageSize(sz);
                        setCustPage(1);
                      }}
                      itemName="khách hàng"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MODAL CHI TIẾT GIAO DỊCH ĐẦY ĐỦ */}
          {selectedTxDetail && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-xs"
              onClick={() => setSelectedTxDetail(null)}
            >
              <div
                className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header modal */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 relative">
                  <button
                    onClick={() => setSelectedTxDetail(null)}
                    className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-200 mb-1">
                    <Receipt className="w-4 h-4" />
                    Chi tiết hóa đơn & Kê khai doanh thu
                  </div>
                  <h2 className="text-2xl font-black">
                    {(selectedTxDetail.amount || 0).toLocaleString('vi-VN')}đ
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {formatPaymentMethod(selectedTxDetail.paymentMethod)}
                    </span>
                    <span className="bg-emerald-800/60 text-emerald-100 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {selectedTxDetail.status === 'SUCCESS' || selectedTxDetail.status === 'PAID' || selectedTxDetail.status === 'COMPLETED'
                        ? 'Thành công'
                        : selectedTxDetail.status === 'PENDING'
                        ? 'Chờ thanh toán'
                        : 'Thất bại'}
                    </span>
                    <span className="text-xs text-green-100">
                      {formatDateTime(selectedTxDetail.paymentDate)}
                    </span>
                  </div>
                </div>

                {/* Body modal */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                  {/* Mã Giao Dịch VNPay & Tham chiếu */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-gray-400" />
                      Mã giao dịch đối soát
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500 block">Mã GD VNPay (vnp_TransactionNo):</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-gray-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                            {selectedTxDetail.transactionCode || 'N/A'}
                          </span>
                          {selectedTxDetail.transactionCode && (
                            <button
                              onClick={() => handleCopy(selectedTxDetail.transactionCode)}
                              className="text-gray-500 hover:text-green-600 p-1.5 rounded-lg hover:bg-gray-200 transition"
                              title="Sao chép mã"
                            >
                              {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 block">Mã đơn hàng (vnp_TxnRef):</span>
                        <div className="font-mono font-semibold text-gray-700 text-sm mt-1">
                          {selectedTxDetail.vnpTxnRef || `BOOK_${selectedTxDetail.rentalId}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin Khách hàng */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-green-600" />
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                      <div>
                        <span className="text-xs text-gray-400">Họ và tên:</span>
                        <div className="font-bold text-gray-900">
                          {selectedTxDetail.customerName || selectedTxDetail.customerUsername || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Tên tài khoản:</span>
                        <div className="font-semibold text-gray-700">@{selectedTxDetail.customerUsername || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Email:</span>
                        <div className="font-medium text-gray-700 text-xs">
                          {selectedTxDetail.customerEmail || 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Số điện thoại:</span>
                        <div className="font-medium text-gray-700 text-xs">
                          {selectedTxDetail.customerPhone || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chi tiết Thuê vườn & Cây trồng */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      Chi tiết thuê vườn & Trụ trồng
                    </h4>
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <span className="text-xs text-gray-400">Cơ sở / Khu vườn:</span>
                          <div className="font-bold text-gray-900">{selectedTxDetail.locationName || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Ô vườn:</span>
                          <div className="font-bold text-green-700">Ô {selectedTxDetail.slotNumber || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Trụ đã thuê:</span>
                          <div className="font-bold text-emerald-800">
                            {selectedTxDetail.pillarCode && selectedTxDetail.pillarCode !== 'N/A'
                              ? `Trụ ${selectedTxDetail.pillarCode}`
                              : 'Toàn bộ trụ trong ô'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-400">Giống cây trồng:</span>
                          <div className="font-bold text-teal-800 text-sm">
                            {selectedTxDetail.treeName || 'Chưa chọn cây'}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Thời hạn hợp đồng:</span>
                          <div className="font-semibold text-gray-800">
                            {selectedTxDetail.durationMonths ? `${selectedTxDetail.durationMonths} tháng` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Mã hợp đồng (Rental):</span>
                          <div className="font-bold text-gray-700">#{selectedTxDetail.rentalId}</div>
                        </div>
                      </div>

                      {(selectedTxDetail.startDate || selectedTxDetail.endDate) && (
                        <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            Hiệu lực từ <strong>{formatDate(selectedTxDetail.startDate)}</strong> đến{' '}
                            <strong>{formatDate(selectedTxDetail.endDate)}</strong>
                          </span>
                        </div>
                      )}

                      {selectedTxDetail.description && (
                        <div className="pt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {selectedTxDetail.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTxDetail(null)}
                    className="btn-primary text-sm py-2 px-5"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </DashboardLayout>
  );
}
