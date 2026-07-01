import { useState, useEffect } from 'react';
import { Grid3X3, Plus, Edit2, X, Search, DollarSign, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Slot {
  id: number;
  slotNumber: string;
  status: string;
  price: number;
  pillarId: number;
}

interface Pillar {
  id: number;
  pillarCode: string;
  locationId: number;
}

const emptyForm = { slotNumber: '', status: 'AVAILABLE', price: 0, pillarId: 0 };

export default function SlotManagement() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Slot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([managerApi.getSlots(), managerApi.getPillars()]);
      setSlots(s);
      setPillars(p);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, pillarId: pillars[0]?.id || 0 });
    setShowForm(true);
  };

  const openEdit = (s: Slot) => {
    setEditing(s);
    setForm({ slotNumber: s.slotNumber, status: s.status, price: s.price, pillarId: s.pillarId });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.slotNumber || !form.pillarId) return;
    setSaving(true);
    try {
      if (editing) {
        await managerApi.updateSlot(editing.id, form);
      } else {
        await managerApi.createSlot(form);
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
      await managerApi.deleteSlot(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch {
      setError('Xóa thất bại. Ô vườn có thể đang được thuê.');
    } finally {
      setDeleting(false);
    }
  };

  const getPillarCode = (id: number) => pillars.find(p => p.id === id)?.pillarCode || `#${id}`;

  const statusConfig: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Trống', cls: 'bg-green-100 text-green-700' },
    RENTED: { label: 'Đang thuê', cls: 'bg-blue-100 text-blue-700' },
    MAINTENANCE: { label: 'Bảo trì', cls: 'bg-yellow-100 text-yellow-700' },
    INACTIVE: { label: 'Ngưng', cls: 'bg-gray-100 text-gray-600' },
  };

  const filtered = slots.filter(s =>
    s.slotNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Ô vườn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm ô vườn..." className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm ô vườn
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có ô vườn nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => {
            const st = statusConfig[s.status] || statusConfig.INACTIVE;
            return (
              <div key={s.id} className="card hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Grid3X3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', st.cls)}>{st.label}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{s.slotNumber}</h3>
                <p className="text-sm text-gray-500 mb-2">Trụ: {getPillarCode(s.pillarId)}</p>
                <div className="flex items-center gap-1 text-green-600 font-bold mb-3">
                  <DollarSign className="w-4 h-4" />
                  {s.price.toLocaleString('vi-VN')}đ
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(s)} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button onClick={() => setConfirmDelete(s)} className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Xóa ô vườn?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc muốn xóa ô vườn <span className="font-semibold text-gray-900">"{confirmDelete.slotNumber}"</span>? Hành động này không thể hoàn tác.
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
              <h2 className="text-xl font-bold">{editing ? 'Sửa ô vườn' : 'Thêm ô vườn mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Mã ô vườn *</label>
                <input className="input" value={form.slotNumber} onChange={e => setForm(f => ({ ...f, slotNumber: e.target.value }))} placeholder="VD: S-Q1-01-A" />
              </div>
              <div>
                <label className="label">Trụ *</label>
                <select className="input" value={form.pillarId} onChange={e => setForm(f => ({ ...f, pillarId: Number(e.target.value) }))}>
                  <option value={0} disabled>Chọn trụ</option>
                  {pillars.map(p => <option key={p.id} value={p.id}>{p.pillarCode}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Giá thuê (VNĐ)</label>
                <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="AVAILABLE">Trống</option>
                  <option value="RENTED">Đang thuê</option>
                  <option value="MAINTENANCE">Bảo trì</option>
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
