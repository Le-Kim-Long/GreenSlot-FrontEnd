import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, X, Search, Phone, Ruler, Trash2, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
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
    </DashboardLayout>
  );
}