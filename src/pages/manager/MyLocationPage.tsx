import { useState, useEffect } from 'react';
import { MapPin, Edit2, X, Phone, Ruler, Loader2, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
import { dashboardApi, DashboardMetrics } from '../../api/dashboardApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Location {
  id: number;
  name: string;
  address: string;
  contactPhone: string;
  status: string;
  area: number;
}

const emptyForm = { name: '', address: '', contactPhone: '', status: 'ACTIVE', area: 0 };

export default function MyLocationPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const now = new Date();
  const [revStartDate, setRevStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [revEndDate, setRevEndDate] = useState(() => now.toISOString().split('T')[0]);
  const [revenue, setRevenue] = useState<{ totalRevenue: number } | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const data: Location[] = await managerApi.getLocations();
      setLocation(data[0] ?? null);
    } catch {
      setError('Không thể tải thông tin cơ sở');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocation(); }, []);

  useEffect(() => {
    if (!location) return;
    fetchMetrics(location.id);
    fetchRevenue(location.id, revStartDate, revEndDate);
  }, [location?.id]);

  const fetchMetrics = async (locationId: number) => {
    setLoadingMetrics(true);
    try {
      const data = await dashboardApi.getLocationMetrics(locationId);
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchRevenue = async (locationId: number, start: string, end: string) => {
    setLoadingRevenue(true);
    try {
      const data = await dashboardApi.getLocationRevenue(locationId, start, end);
      setRevenue(data);
    } catch {
      setRevenue(null);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const openEdit = () => {
    if (!location) return;
    setError('');
    setForm({
      name: location.name,
      address: location.address,
      contactPhone: location.contactPhone,
      status: location.status,
      area: location.area,
    });
    setEditing(true);
  };

  const handleSubmit = async () => {
    if (!location) return;
    if (!form.name?.trim() || !form.address?.trim()) {
      setError('Vui lòng nhập đầy đủ Tên cơ sở và Địa chỉ.');
      return;
    }
    if (form.area < 0) {
      setError('Diện tích cơ sở không được là số âm.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await managerApi.updateLocation(location.id, form);
      setEditing(false);
      fetchLocation();
    } catch {
      setError('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navItems={staffNavItems} title="Cơ sở của tôi">
      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : !location ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Bạn chưa được gán quản lý cơ sở nào. Vui lòng liên hệ quản trị viên.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Thông tin cơ sở */}
          <div className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{location.name}</h2>
                  <p className="text-sm text-gray-500">{location.address}</p>
                </div>
              </div>
              <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', location.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                {location.status === 'ACTIVE' ? 'Hoạt động' : location.status}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{location.contactPhone || 'Chưa có SĐT'}</span>
              <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4" />{location.area} m²</span>
            </div>
            <button onClick={openEdit} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit2 className="w-4 h-4" /> Chỉnh sửa thông tin
            </button>
          </div>

          {/* Tổng quan vận hành */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Tổng quan vận hành</h3>
            {loadingMetrics ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm">Đang tải số liệu vận hành...</p>
              </div>
            ) : metrics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <div className="text-2xl font-black text-gray-900">{metrics.activeRentals}</div>
                    <div className="text-sm text-gray-500">Ô đang thuê</div>
                  </div>
                  <div className="card">
                    <div className="text-2xl font-black text-amber-600">{metrics.pendingAlerts}</div>
                    <div className="text-sm text-gray-500">Cảnh báo chờ xử lý</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-600" /> Doanh thu cơ sở</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <input type="date" className="input py-1 text-xs" value={revStartDate} onChange={e => { setRevStartDate(e.target.value); fetchRevenue(location.id, e.target.value, revEndDate); }} />
                      <span className="text-gray-400">—</span>
                      <input type="date" className="input py-1 text-xs" value={revEndDate} onChange={e => { setRevEndDate(e.target.value); fetchRevenue(location.id, revStartDate, e.target.value); }} />
                    </div>
                  </div>
                  <div className="card">
                    {loadingRevenue ? (
                      <div className="text-center py-4 text-gray-400 text-sm">Đang tải...</div>
                    ) : (
                      <div className="text-2xl font-black text-green-600">{(revenue?.totalRevenue ?? 0).toLocaleString('vi-VN')}đ</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">Ô đang thuê tại cơ sở</h4>
                  {metrics.activeRentalsList.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">Không có ô nào đang thuê.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                            <th className="pb-2 font-medium">Khách hàng</th>
                            <th className="pb-2 font-medium">Ô / Trụ</th>
                            <th className="pb-2 font-medium">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {metrics.activeRentalsList.map(r => (
                            <tr key={r.rentalId}>
                              <td className="py-2 text-gray-800">{r.fullName || r.username}</td>
                              <td className="py-2 text-gray-600">{r.slotNumber} · {r.pillarCode}</td>
                              <td className="py-2 text-gray-600">{r.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Cảnh báo chờ xử lý</h4>
                  {metrics.recentAlerts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">Không có cảnh báo nào.</div>
                  ) : (
                    <div className="space-y-2">
                      {metrics.recentAlerts.map(a => (
                        <div key={a.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
                          <div className="font-medium text-amber-800">#{a.id} · {a.alertType} — {a.description}</div>
                          <div className="text-xs text-amber-600 mt-0.5">Trụ {a.pillarCode} · Ô {a.slotNumber} · {a.sensorType}: {a.actualValue} (ngưỡng {a.thresholdValue})</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">Không thể tải dữ liệu vận hành.</div>
            )}
          </div>
        </div>
      )}

      {editing && location && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Sửa thông tin cơ sở</h2>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tên cơ sở *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Cơ sở Quận 1" />
              </div>
              <div>
                <label className="label">Địa chỉ *</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Nhập địa chỉ" />
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input className="input" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="0901234567" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Diện tích (m²)</label>
                  <input type="number" className="input" value={form.area} onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Trạng thái</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngưng</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Đang lưu...' : 'Cập nhật'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary px-4">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
