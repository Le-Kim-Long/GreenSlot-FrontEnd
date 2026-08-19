import { useState, useEffect } from 'react';
import { Columns3, Plus, Edit2, X, Search, Trash2, Loader2, Sprout, Layers } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi, PillarItem, PillarFormData } from '../../api/managerApi';
import { treeApi, Tree } from '../../api/treeApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Location {
  id: number;
  name: string;
}

const PILLAR_TYPES = [
  { value: 'SMALL', label: 'Trụ Nhỏ (24 hốc - Chiếm 1.0 m²)', holes: 24, defaultPrice: 150000 },
  { value: 'MEDIUM', label: 'Trụ Vừa (36 hốc - Chiếm 1.5 m²)', holes: 36, defaultPrice: 200000 },
  { value: 'LARGE', label: 'Trụ Lớn (48 hốc - Chiếm 2.0 m²)', holes: 48, defaultPrice: 300000 },
];

const emptyForm: PillarFormData = {
  pillarCode: '',
  status: 'ACTIVE',
  locationId: 0,
  pillarType: 'MEDIUM',
  capacityHoles: 36,
  price: 200000,
  defaultTreeId: null,
};

export default function PillarManagement() {
  const [pillars, setPillars] = useState<PillarItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PillarItem | null>(null);
  const [form, setForm] = useState<PillarFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PillarItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [p, l, t, s] = await Promise.all([
        managerApi.getPillars(),
        managerApi.getLocations(),
        treeApi.getTrees().catch(() => []),
        managerApi.getSlots().catch(() => []),
      ]);
      setPillars(Array.isArray(p) ? p : []);
      setLocations(Array.isArray(l) ? l : []);
      setTrees(Array.isArray(t) ? t.filter((item: Tree) => item.isActive) : []);
      setSlots(Array.isArray(s) ? s : []);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePillarTypeChange = (newType: string) => {
    const matched = PILLAR_TYPES.find(t => t.value === newType);
    setForm(f => ({
      ...f,
      pillarType: newType,
      capacityHoles: matched ? matched.holes : 36,
      price: matched ? matched.defaultPrice : 200000,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setError('');
    setForm({
      ...emptyForm,
      locationId: locations[0]?.id || 0,
      slotId: null,
    });
    setShowForm(true);
  };

  const openEdit = async (p: PillarItem) => {
    setError('');
    setEditing(p);
    setShowForm(true);
    setLoadingDetail(true);

    try {
      const freshPillar: PillarItem = await managerApi.getPillar(p.id);
      setEditing(freshPillar);
      setForm({
        pillarCode: freshPillar.pillarCode,
        status: freshPillar.status,
        locationId: freshPillar.locationId,
        slotId: freshPillar.slotId || null,
        pillarType: freshPillar.pillarType || 'MEDIUM',
        capacityHoles: freshPillar.capacityHoles || 36,
        price: freshPillar.price || 200000,
        defaultTreeId: freshPillar.defaultTreeId || null,
        imageUrl: freshPillar.imageUrl,
      });
    } catch {
      setError('Không thể tải thông tin chi tiết mới nhất từ máy chủ.');
      setShowForm(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.pillarCode?.trim() || !form.locationId || form.locationId === 0) {
      setError('Vui lòng nhập đầy đủ Mã trụ và chọn Cơ sở.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await managerApi.updatePillar(editing.id, form);
      } else {
        await managerApi.createPillar(form);
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await managerApi.deletePillar(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Xóa thất bại. Trụ có thể đang được gán vào ô vườn hoặc có dữ liệu cảm biến.');
    } finally {
      setDeleting(false);
    }
  };

  const getLocationName = (id: number) => locations.find(l => l.id === id)?.name || `#${id}`;

  const filtered = pillars.filter(p =>
    p.pillarCode.toLowerCase().includes(search.toLowerCase()) ||
    (p.defaultTreeName && p.defaultTreeName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Trụ vườn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm mã trụ, rau trồng..." className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm trụ mới
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm font-medium border border-red-100">{error}</div>}

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
                <th className="pb-3 font-medium">Mã trụ & Phân loại</th>
                <th className="pb-3 font-medium">Sức chứa & Diện tích</th>
                <th className="pb-3 font-medium">Giá thuê trụ</th>
                <th className="pb-3 font-medium">Rau / Cây gán sẵn</th>
                <th className="pb-3 font-medium">Cơ sở</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const isSmall = p.pillarType === 'SMALL';
                const isLarge = p.pillarType === 'LARGE';
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm",
                          isLarge ? "bg-purple-100 text-purple-700 border border-purple-200" :
                          isSmall ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                          "bg-blue-100 text-blue-700 border border-blue-200"
                        )}>
                          <Columns3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {p.pillarCode}
                            <span className={clsx(
                              'text-[11px] px-2 py-0.5 rounded-full font-semibold',
                              isLarge ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              isSmall ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            )}>
                              {p.pillarTypeName || (isLarge ? 'Trụ Lớn' : isSmall ? 'Trụ Nhỏ' : 'Trụ Vừa')}
                            </span>
                          </div>
                          {p.slotNumber ? (
                            <span className="text-xs text-gray-500 font-medium">Gán tại Ô: <span className="text-gray-700 font-semibold">{p.slotNumber}</span></span>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">Chưa gán vào ô vườn</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                          <Layers className="w-3.5 h-3.5 text-green-600" />
                          <span>{p.capacityHoles || (isLarge ? 48 : isSmall ? 24 : 36)} hốc canh tác</span>
                        </div>
                        <span className="text-[11px] text-gray-400">Yêu cầu diện tích: {p.requiredArea || (isLarge ? 2.0 : isSmall ? 1.0 : 1.5)} m²</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-green-700">
                        {(p.price || (isLarge ? 300000 : isSmall ? 150000 : 200000)).toLocaleString('vi-VN')}đ
                        <span className="text-gray-400 font-normal text-xs">/tháng</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      {p.defaultTreeName ? (
                        <div className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-800 px-2.5 py-1 rounded-xl w-fit font-medium">
                          <Sprout className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>{p.defaultTreeName}</span>
                          {p.defaultTreePrice && (
                            <span className="text-green-600 font-bold">({p.defaultTreePrice.toLocaleString('vi-VN')}đ)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa gán giống</span>
                      )}
                    </td>
                    <td className="py-3.5 text-gray-600 text-xs font-medium">{getLocationName(p.locationId)}</td>
                    <td className="py-3.5">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold shadow-xs', p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : p.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>
                        {p.status === 'ACTIVE' ? 'Hoạt động' : p.status === 'MAINTENANCE' ? 'Bảo trì' : p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-green-600 transition-colors" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(p)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors" title="Xóa trụ">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Xóa trụ vườn?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc muốn xóa trụ <span className="font-semibold text-gray-900">"{confirmDelete.pillarCode}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary rounded-xl">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Chỉnh sửa Trụ Vườn' : 'Thêm Trụ Vườn Mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm">Đang tải dữ liệu thực thể từ Server...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label font-medium text-gray-700">Mã trụ *</label>
                  <input className="input rounded-xl" value={form.pillarCode} onChange={e => setForm(f => ({ ...f, pillarCode: e.target.value }))} placeholder="VD: P-Q1-01" />
                </div>

                <div>
                  <label className="label font-medium text-gray-700">Loại Trụ Canh Tác (Kích thước & Sức chứa) *</label>
                  <select
                    className="input rounded-xl"
                    value={form.pillarType}
                    onChange={e => handlePillarTypeChange(e.target.value)}
                  >
                    {PILLAR_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label font-medium text-gray-700">Số hốc trồng</label>
                    <input
                      type="number"
                      className="input rounded-xl"
                      value={form.capacityHoles}
                      onChange={e => setForm(f => ({ ...f, capacityHoles: Number(e.target.value) }))}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label font-medium text-gray-700">Giá thuê trụ (VNĐ/tháng)</label>
                    <input
                      type="number"
                      className="input rounded-xl font-bold text-green-700"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                      step={10000}
                    />
                  </div>
                </div>

                <div>
                  <label className="label font-medium text-gray-700">Loại Rau / Cây Giống Gán Sẵn (Tùy chọn)</label>
                  <select
                    className="input rounded-xl"
                    value={form.defaultTreeId || 0}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setForm(f => ({ ...f, defaultTreeId: val > 0 ? val : null }));
                    }}
                  >
                    <option value={0}>-- Không gán trước (Khách hàng tự chọn) --</option>
                    {trees.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.treeName} - {t.price?.toLocaleString('vi-VN')} VNĐ
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Location Manager có thể tạo sẵn cấu hình rau để khách hàng chỉ cần vào chọn thuê ngay.</p>
                </div>

                <div>
                  <label className="label font-medium text-gray-700">Cơ sở *</label>
                  <select className="input rounded-xl" value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: Number(e.target.value), slotId: null }))}>
                    <option value={0} disabled>Chọn cơ sở</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label font-medium text-gray-700">Gán vào Ô Vườn Cụ Thể (Tùy chọn)</label>
                  <select
                    className="input rounded-xl"
                    value={form.slotId || 0}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setForm(f => ({ ...f, slotId: val > 0 ? val : null }));
                    }}
                  >
                    <option value={0}>-- Để chung tại cơ sở (Tất cả ô trong cơ sở đều có thể chọn) --</option>
                    {slots
                      .filter(s => !form.locationId || s.locationId === form.locationId)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          Ô {s.slotNumber} (Diện tích {s.area || 3.0} m²)
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Nếu không gán ô cụ thể, trụ sẽ khả dụng chung cho khách hàng khi thuê ô vườn tại cơ sở này.</p>
                </div>

                <div>
                  <label className="label font-medium text-gray-700">Trạng thái</label>
                  <select className="input rounded-xl" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 py-3 rounded-xl shadow-md">
                    {saving ? 'Đang lưu...' : editing ? 'Cập nhật Trụ' : 'Tạo Trụ Mới'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-secondary px-5 rounded-xl">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}