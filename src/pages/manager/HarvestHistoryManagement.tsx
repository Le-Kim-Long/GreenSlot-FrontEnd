import { useState, useEffect } from 'react';
import { Sprout, Calendar, MapPin, User, Loader2, History, Search } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';

export default function HarvestHistoryManagement() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    harvestHistoryApi.getManagerHistory()
      .then(setItems)
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item =>
    item.treeName?.toLowerCase().includes(search.toLowerCase()) ||
    item.slotNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    item.staffName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Lịch sử thu hoạch">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lịch sử thu hoạch</h2>
            <p className="text-gray-500 text-sm mt-1">Tất cả các lần thu hoạch đã hoàn tất tại cơ sở của bạn.</p>
          </div>
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên cây, ô đất, khách hàng, nhân viên..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Cây trồng</th>
                <th className="p-4 font-semibold text-gray-600">Ô đất / Cơ sở</th>
                <th className="p-4 font-semibold text-gray-600">Khách hàng</th>
                <th className="p-4 font-semibold text-gray-600">Trồng / Thu hoạch</th>
                <th className="p-4 font-semibold text-gray-600">Hình thức</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải lịch sử thu hoạch...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Chưa có lượt thu hoạch nào được ghi nhận.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <Sprout className="w-4 h-4 text-green-600" /> {item.treeName || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-4 h-4 text-amber-500" /> {item.slotNumber || 'N/A'}
                      </div>
                      {item.locationName && <div className="text-xs text-gray-400 mt-0.5">{item.locationName}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <User className="w-4 h-4 text-blue-500" /> {item.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {item.plantedAt ? new Date(item.plantedAt).toLocaleDateString('vi-VN') : '—'}
                        {' → '}
                        {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
