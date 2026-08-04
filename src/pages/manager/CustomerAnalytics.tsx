import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Search, Loader2, Hash, ArrowUpDown } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { customerAnalyticsApi, type CustomerLifetimeValue } from '../../api/customerAnalyticsApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const adminNavItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <Users className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <Users className="w-full h-full" /> },
  { label: 'Camera IoT', path: '/dashboard/admin/cameras', icon: <Users className="w-full h-full" /> },
  { label: 'Giá trị khách hàng', path: '/dashboard/admin/customer-value', icon: <DollarSign className="w-full h-full" /> },
];

type SortKey = 'customerLifetimeValue' | 'totalSpent' | 'totalRentals' | 'userName';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
}

function formatMoney(v: number | null | undefined): string {
  return `${(v || 0).toLocaleString('vi-VN')}đ`;
}

export default function CustomerAnalytics() {
  const isAdminView = window.location.pathname.startsWith('/dashboard/admin');
  const navItems = isAdminView ? adminNavItems : staffNavItems;

  const [list, setList] = useState<CustomerLifetimeValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('customerLifetimeValue');
  const [sortDesc, setSortDesc] = useState(true);

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<CustomerLifetimeValue | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    setError('');
    customerAnalyticsApi.getAllCLVs()
      .then(setList)
      .catch(() => setError('Không thể tải danh sách giá trị khách hàng (CLV) từ máy chủ.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLookup = async () => {
    const id = Number(lookupId);
    if (!id || id <= 0) {
      setLookupError('Nhập User ID hợp lệ.');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const result = await customerAnalyticsApi.getCLV(id);
      setLookupResult(result);
    } catch {
      setLookupError(`Không tìm thấy CLV cho User ID #${id}.`);
    } finally {
      setLookupLoading(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(d => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const filtered = list.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.userName?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDesc ? -1 : 1;
    if (sortKey === 'userName') return a.userName.localeCompare(b.userName) * dir;
    return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
  });

  const totalCLV = list.reduce((sum, c) => sum + (c.customerLifetimeValue || 0), 0);
  const totalSpentAll = list.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th className="p-4 cursor-pointer select-none" onClick={() => toggleSort(sortKeyName)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={clsx('w-3 h-3', sortKey === sortKeyName ? 'text-green-600' : 'text-gray-300')} />
      </span>
    </th>
  );

  return (
    <DashboardLayout navItems={navItems} title="Giá trị vòng đời khách hàng (CLV)">
      {/* Tra cứu theo User ID */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Tra cứu CLV theo User ID</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            className="input flex-1"
            placeholder="Nhập User ID..."
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
          />
          <button onClick={handleLookup} disabled={lookupLoading} className="btn-primary flex items-center gap-2 justify-center">
            {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Tra cứu
          </button>
        </div>
        {lookupError && <div className="text-red-600 text-sm mt-3">{lookupError}</div>}
        {lookupResult && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><div className="text-gray-400 text-xs">Khách hàng</div><div className="font-bold">{lookupResult.userName}</div></div>
            <div><div className="text-gray-400 text-xs">Email</div><div className="font-semibold">{lookupResult.userEmail}</div></div>
            <div><div className="text-gray-400 text-xs">Tổng chi tiêu</div><div className="font-bold text-green-600">{formatMoney(lookupResult.totalSpent)}</div></div>
            <div><div className="text-gray-400 text-xs">CLV ước tính</div><div className="font-black text-green-700">{formatMoney(lookupResult.customerLifetimeValue)}</div></div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-sm font-medium">Đang tổng hợp CLV toàn bộ khách hàng...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{list.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng chi tiêu</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{formatMoney(totalSpentAll)}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng CLV ước tính</div>
                  <div className="text-2xl font-black text-gray-900 mt-0.5">{formatMoney(totalCLV)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9"
                  placeholder="Tìm theo tên hoặc email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <SortHeader label="Khách hàng" sortKeyName="userName" />
                    <th className="p-4">Email</th>
                    <SortHeader label="Tổng chi tiêu" sortKeyName="totalSpent" />
                    <SortHeader label="Số lượt thuê" sortKeyName="totalRentals" />
                    <th className="p-4 text-right">TB / lượt</th>
                    <th className="p-4">Lượt thuê đầu — cuối</th>
                    <SortHeader label="CLV ước tính" sortKeyName="customerLifetimeValue" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(c => (
                    <tr key={c.userId} className="hover:bg-gray-50/80 transition">
                      <td className="p-4 font-bold text-gray-900">
                        <div>{c.userName}</div>
                        <div className="inline-flex items-center gap-1 text-xs font-normal text-gray-400 mt-0.5">
                          <Hash className="w-3 h-3" />{c.userId}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{c.userEmail}</td>
                      <td className="p-4 font-semibold text-gray-700">{formatMoney(c.totalSpent)}</td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">{c.totalRentals}</span>
                      </td>
                      <td className="p-4 text-right text-gray-500">{formatMoney(c.averageRentalValue)}</td>
                      <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(c.firstRentalDate)} — {formatDate(c.lastRentalDate)}
                      </td>
                      <td className="p-4 text-right font-black text-green-600 text-base">{formatMoney(c.customerLifetimeValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-medium">Không có dữ liệu khách hàng phù hợp</div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
