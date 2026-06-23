import { useState, useEffect } from 'react';
import { Columns3, Plus, Edit2, X, Search } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Pillar {
  id: number;
  pillarCode: string;
  status: string;
  locationId: number;
}

interface Location {
  id: number;
  name: string;
}

const emptyForm = { pillarCode: '', status: 'ACTIVE', locationId: 0 };

export default function PillarManagement() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pillar | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [p, l] = await Promise.all([managerApi.getPillars(), managerApi.getLocations()]);
      setPillars(p);
      setLocations(l);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, locationId: locations[0]?.id || 0 });
    setShowForm(true);
  };

  const openEdit = (p: Pillar) => {
    setEditing(p);
    setForm({ pillarCode: p.pillarCode, status: p.status, locationId: p.locationId });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.pillarCode || !form.locationId) return;
    setSaving(true);
    try {
      if (editing) {
        await managerApi.updatePillar(editing.id, form);
      } else {
        await managerApi.createPillar(form);
      }
      setShowForm(false);
      fetchData();
    } catch {
      setError('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const getLocationName = (id: number) => locations.find(l => l.id === id)?.name || `#${id}`;

  const filtered = pillars.filter(p =>
    p.pillarCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Trụ vườn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm mã trụ..." className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm trụ
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Columns3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có trụ vườn nào</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">Mã trụ</th>
                <th className="pb-3 font-medium">Cơ sở</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Columns3 className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{p.pillarCode}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{getLocationName(p.locationId)}</td>
                  <td className="py-3">
                    <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                      {p.status === 'ACTIVE' ? 'Hoạt động' : p.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing ? 'Sửa trụ vườn' : 'Thêm trụ mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Mã trụ *</label>
                <input className="input" value={form.pillarCode} onChange={e => setForm(f => ({ ...f, pillarCode: e.target.value }))} placeholder="VD: P-Q1-01" />
              </div>
              <div>
                <label className="label">Cơ sở *</label>
                <select className="input" value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: Number(e.target.value) }))}>
                  <option value={0} disabled>Chọn cơ sở</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Ngưng</option>
                </select>
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
