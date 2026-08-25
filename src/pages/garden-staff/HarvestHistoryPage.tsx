import { useState, useEffect } from 'react';
import {
  ClipboardList, Wifi, ShieldAlert, CheckCircle, Calendar,
  Sprout, MapPin, User, Loader2, History, Camera,
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> },
];

export default function HarvestHistoryPage() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    harvestHistoryApi.getManagerHistory()
      .then(setItems)
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thu hoạch">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Lịch sử thu hoạch</h2>
        <p className="text-gray-500 text-sm mt-1">Các lần thu hoạch đã hoàn tất tại cơ sở của bạn.</p>
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
        <div className="space-y-3">
          {items.map(item => (
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
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                {item.pillarCodes && (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    🏷️ Trụ: {item.pillarCodes}
                  </span>
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
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
