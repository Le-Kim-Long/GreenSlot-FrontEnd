import { useState, useEffect } from 'react';
import { Sprout, Calendar, MapPin, User, Loader2, History } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { customerNavItems as navItems } from './customerNavItems';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';

export default function CustomerHarvestHistoryPage() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    harvestHistoryApi.getMyHistory()
      .then(setItems)
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thu hoạch">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử thu hoạch</h2>
        <p className="text-gray-500 text-sm mt-1">Các lần thu hoạch đã hoàn tất trên các ô đất bạn từng thuê.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">Bạn chưa có lần thu hoạch nào được ghi nhận.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-green-600" /> {item.treeName || 'Không rõ giống cây'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Ô {item.slotNumber} {item.locationName ? `· ${item.locationName}` : ''}
                  </div>
                </div>
                <span className={
                  item.harvestMethod === 'SELF'
                    ? 'badge-green'
                    : 'badge-blue'
                }>
                  {item.harvestMethod === 'SELF' ? 'Tự thu hoạch' : 'Nhân viên thu hoạch'}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {item.plantedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Trồng: {new Date(item.plantedAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Thu hoạch: {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
                </span>
                {item.harvestMethod === 'STAFF' && item.staffName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Nhân viên: {item.staffName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
