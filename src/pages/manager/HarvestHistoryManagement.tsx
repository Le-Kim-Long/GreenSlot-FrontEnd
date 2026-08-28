import { useState, useEffect, useMemo } from 'react';
import { Sprout, Calendar, MapPin, User, History, Search } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { staffNavItems } from './staffNav';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';

export default function HarvestHistoryManagement() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EARLY' | 'NORMAL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    harvestHistoryApi.getManagerHistory()
      .then(setItems)
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter(item => {
        const matchSearch =
          item.treeName?.toLowerCase().includes(search.toLowerCase()) ||
          item.slotNumber?.toLowerCase().includes(search.toLowerCase()) ||
          item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          item.staffName?.toLowerCase().includes(search.toLowerCase()) ||
          item.pillarCodes?.toLowerCase().includes(search.toLowerCase());

        if (!matchSearch) return false;
        if (filterType === 'EARLY') return item.isEarlyHarvest;
        if (filterType === 'NORMAL') return !item.isEarlyHarvest;
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.harvestedAt || a.plantedAt || 0).getTime();
        const timeB = new Date(b.harvestedAt || b.plantedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return b.id - a.id;
      });
  }, [items, search, filterType]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <DashboardLayout navItems={staffNavItems} title="Lịch sử thu hoạch">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lịch sử thu hoạch & Sản lượng</h2>
            <p className="text-gray-500 text-sm mt-1">Tất cả các đợt thu hoạch đã hoàn tất tại cơ sở của bạn.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm text-xs font-semibold">
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'ALL' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Tất cả ({items.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('EARLY');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'EARLY' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Thu hoạch sớm ({items.filter(i => i.isEarlyHarvest).length})
              </button>
              <button
                onClick={() => {
                  setFilterType('NORMAL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${filterType === 'NORMAL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Đúng chu kỳ ({items.filter(i => !i.isEarlyHarvest).length})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm cây, ô, trụ, khách..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-xs shadow-sm outline-none bg-white"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">{error}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Cây trồng & Trụ</th>
                <th className="p-4 font-semibold text-gray-600">Ô đất / Cơ sở</th>
                <th className="p-4 font-semibold text-gray-600">Khách hàng</th>
                <th className="p-4 font-semibold text-gray-600">Thời gian & Sinh trưởng</th>
                <th className="p-4 font-semibold text-gray-600">Hình thức thu hoạch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải lịch sử thu hoạch...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Chưa có lượt thu hoạch nào khớp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                        <Sprout className="w-4 h-4 text-green-600" /> {item.treeName || 'N/A'}
                      </div>
                      {item.pillarCodes && (
                        <div className="mt-1">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            Trụ: {item.pillarCodes}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                        <MapPin className="w-4 h-4 text-amber-500" /> Ô {item.slotNumber || 'N/A'}
                      </div>
                      {item.locationName && <div className="text-xs text-gray-400 mt-0.5">{item.locationName}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                        <User className="w-4 h-4 text-blue-500" /> {item.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {item.plantedAt ? new Date(item.plantedAt).toLocaleDateString('vi-VN') : '—'}
                        {' → '}
                        {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.daysGrown != null && (
                          <span className="text-[11px] text-gray-500">
                            ⏱️ {item.daysGrown} ngày {item.harvestDays ? `(chu kỳ ${item.harvestDays} ngày)` : ''}
                          </span>
                        )}
                        {item.isEarlyHarvest && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Thu hoạch sớm
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={item.harvestMethod === 'SELF' ? 'badge-green' : 'badge-blue'}>
                        {item.harvestMethod === 'SELF' ? 'Khách tự thu hoạch' : `Nhân viên${item.staffName ? ': ' + item.staffName : ''}`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
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
                itemName="lượt thu hoạch"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
