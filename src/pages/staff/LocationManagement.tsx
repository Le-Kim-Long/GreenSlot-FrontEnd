import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, X, Search, Phone, Ruler } from 'lucide-react';
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
  const [error, setError] = useState('');

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
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({ name: loc.name, address: loc.address, contactPhone: loc.contactPhone, status: loc.status, area: loc.area });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address) return;
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
              <button onClick={() => openEdit(loc)} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing ? 'Sửa cơ sở' : 'Thêm cơ sở mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
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
                  {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary px-4">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
