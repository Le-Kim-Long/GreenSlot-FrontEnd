import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, X, Search, Phone, Ruler, Trash2, Loader2, LayoutDashboard, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
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

export default function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false); // 👉 State loading cho lúc lấy chi tiết
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dashboard theo cơ sở
  const [dashboardLoc, setDashboardLoc] = useState<Location | null>(null);
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

  const fetchData = async () => {
    try {
      const data = await managerApi.getLocations();
      setLocations(data);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setError('');
    setForm(emptyForm);
    setShowForm(true);
  };

  // 👉 Cập nhật openEdit thành async để lấy data chi tiết từ Server
  const openEdit = async (loc: Location) => {
    setError('');
    setEditing(loc); // Đặt tạm thời để tiêu đề Modal hiện chữ "Sửa cơ sở"
    setForm(emptyForm); // Reset dữ liệu form trong lúc chờ
    setShowForm(true);
    setLoadingDetail(true);

    try {
      // 💥 Gọi API detail lấy dữ liệu mới nhất
      const freshLoc = await managerApi.getLocation(loc.id);
      
      setEditing(freshLoc);
      setForm({ 
        name: freshLoc.name, 
        address: freshLoc.address, 
        contactPhone: freshLoc.contactPhone, 
        status: freshLoc.status, 
        area: freshLoc.area 
      });
    } catch (err) {
      setError('Không thể tải thông tin chi tiết mới nhất từ máy chủ.');
      setShowForm(false); // Tắt form nếu lỗi không lấy được dữ liệu
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async () => {
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
      if (editing) {
        await managerApi.updateLocation(editing.id, form);
      } else {
        await managerApi.createLocation(form);
      }
      setShowForm(false);
      fetchData();
    } catch {
      setError('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await managerApi.deleteLocation(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch {
      setError('Xóa thất bại. Cơ sở có thể đang được sử dụng.');
    } finally {
      setDeleting(false);
    }
  };

  const openDashboard = async (loc: Location) => {
    setDashboardLoc(loc);
    setMetrics(null);
    setRevenue(null);
    setLoadingMetrics(true);
    try {
      const data = await dashboardApi.getLocationMetrics(loc.id);
      setMetrics(data);
    } catch {
      setError('Không thể tải dashboard của cơ sở này.');
    } finally {
      setLoadingMetrics(false);
    }
    fetchRevenue(loc.id, revStartDate, revEndDate);
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

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Cơ sở">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm cơ sở..." className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm cơ sở
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có cơ sở nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(loc => (
            <div key={loc.id} className="card hover:border-green-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', loc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                  {loc.status === 'ACTIVE' ? 'Hoạt động' : loc.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{loc.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{loc.address}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{loc.contactPhone}</span>
                <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{loc.area} m²</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => openDashboard(loc)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </button>
                <button onClick={() => openEdit(loc)} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                </button>
                <button onClick={() => setConfirmDelete(loc)} className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Xóa cơ sở?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc muốn xóa <span className="font-semibold text-gray-900">"{confirmDelete.name}"</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition-colors">
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing ? 'Sửa cơ sở' : 'Thêm cơ sở mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            {/* 👉 Tách UI: Spinner loading vs Form điền liệu */}
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm">Đang tải chi tiết cơ sở...</p>
              </div>
            ) : (
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
                    {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-secondary px-4">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {dashboardLoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-600" /> Dashboard cơ sở: {dashboardLoc.name}
              </h2>
              <button onClick={() => setDashboardLoc(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {loadingMetrics ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

                {/* Doanh thu theo khoảng ngày */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-600" /> Doanh thu cơ sở</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <input type="date" className="input py-1 text-xs" value={revStartDate} onChange={e => { setRevStartDate(e.target.value); fetchRevenue(dashboardLoc.id, e.target.value, revEndDate); }} />
                      <span className="text-gray-400">—</span>
                      <input type="date" className="input py-1 text-xs" value={revEndDate} onChange={e => { setRevEndDate(e.target.value); fetchRevenue(dashboardLoc.id, revStartDate, e.target.value); }} />
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

                {/* Danh sách ô đang thuê */}
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Ô đang thuê tại cơ sở</h3>
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

                {/* Cảnh báo đang chờ xử lý */}
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Cảnh báo chờ xử lý</h3>
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
              <div className="text-center py-12 text-gray-400 text-sm">Không thể tải dữ liệu dashboard.</div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}