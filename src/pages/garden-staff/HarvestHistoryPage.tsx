import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Wifi, ShieldAlert, Calendar,
  Sprout, MapPin, User, Loader2, History, Camera, Eye, Image as ImageIcon,
  Search,
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';
import HarvestHistoryDetailModal from '../../components/harvest/HarvestHistoryDetailModal';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  // { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> },
];

export default function HarvestHistoryPage() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItem, setSelectedItem] = useState<HarvestHistoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'SELF' | 'STAFF' | 'EARLY'>('ALL');

  useEffect(() => {
    harvestHistoryApi.getManagerHistory()
      .then(data => {
        const sorted = (data || []).sort((a: HarvestHistoryItem, b: HarvestHistoryItem) => {
          const timeA = new Date(a.harvestedAt || a.plantedAt || 0).getTime();
          const timeB = new Date(b.harvestedAt || b.plantedAt || 0).getTime();
          if (timeA !== timeB) return timeB - timeA;
          return b.id - a.id;
        });
        setItems(sorted);
      })
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        item.treeName?.toLowerCase().includes(q) ||
        item.slotNumber?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.staffName?.toLowerCase().includes(q) ||
        item.pillarCodes?.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (filterMethod === 'SELF') return item.harvestMethod === 'SELF';
      if (filterMethod === 'STAFF') return item.harvestMethod === 'STAFF';
      if (filterMethod === 'EARLY') return Boolean(item.isEarlyHarvest);
      return true;
    });
  }, [items, search, filterMethod]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thu hoạch">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lịch sử thu hoạch</h2>
          <p className="text-gray-500 text-sm mt-1">Các lần thu hoạch đã hoàn tất tại cơ sở của bạn.</p>
        </div>

        {/* Bộ lọc phương thức thu hoạch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-2xs text-xs font-semibold">
            <button
              onClick={() => { setFilterMethod('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${filterMethod === 'ALL' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => { setFilterMethod('SELF'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${filterMethod === 'SELF' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              🌾 Khách tự hái ({items.filter(i => i.harvestMethod === 'SELF').length})
            </button>
            <button
              onClick={() => { setFilterMethod('STAFF'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${filterMethod === 'STAFF' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              👨‍🌾 Nhân viên hái ({items.filter(i => i.harvestMethod === 'STAFF').length})
            </button>
            <button
              onClick={() => { setFilterMethod('EARLY'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${filterMethod === 'EARLY' ? 'bg-amber-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ⚡ Thu hoạch sớm ({items.filter(i => i.isEarlyHarvest).length})
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm cây, ô, trụ, khách..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs shadow-2xs outline-none bg-white"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có lượt thu hoạch nào được ghi nhận tại cơ sở của bạn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedItems.map(item => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-green-600" /> {item.treeName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Ô {item.slotNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.isEarlyHarvest && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
                        🌱 Thu hoạch sớm {item.daysGrown != null && item.harvestDays ? `(${item.daysGrown}/${item.harvestDays} ngày)` : ''}
                      </span>
                    )}
                    <span className={item.harvestMethod === 'SELF' ? 'badge-green' : 'badge-blue'}>
                      {item.harvestMethod === 'SELF' ? 'Khách tự thu hoạch' : `Nhân viên${item.staffName ? ': ' + item.staffName : ''}`}
                    </span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                  {item.pillarCodes && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {item.pillarCodes.split(',').map(s => s.trim()).filter(Boolean).map((pCode, idx) => (
                        <span key={idx} className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          🏷️ Trụ: {pCode} {item.pillarHarvestCount ? `(Thu hoạch lần ${item.pillarHarvestCount})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.plantedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Gieo trồng: {new Date(item.plantedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Thu hoạch: {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
                  </span>
                  {item.daysGrown != null && (
                    <span className="text-gray-600 font-medium">
                      ⏱️ Sinh trưởng: <strong className="text-gray-900">{item.daysGrown} ngày</strong> {item.harvestDays ? `(Chu kỳ: ${item.harvestDays} ngày)` : ''}
                    </span>
                  )}
                  {item.customerName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Khách hàng: {item.customerName}
                    </span>
                  )}
                </div>

                {/* ẢNH NGHIỆM THU */}
                {item.evidenceImageUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Ảnh nghiệm thu:
                    </span>
                    <div className="flex items-center gap-2">
                      {item.evidenceImageUrl.split(',').map(s => s.trim()).filter(Boolean).map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setSelectedItem(item)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:border-emerald-500 transition shadow-2xs"
                          title="Bấm để xem chi tiết"
                        >
                          <img
                            src={imgUrl}
                            alt={`Nghiệm thu ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Ảnh';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
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

      {/* Modal chi tiết đợt thu hoạch */}
      <HarvestHistoryDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </DashboardLayout>
  );
}
