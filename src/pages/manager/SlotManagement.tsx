import { useState, useEffect, useMemo } from 'react';
import { Grid3X3, Plus, Edit2, X, Search, DollarSign, Trash2, Loader2, Image as ImageIcon, MapPin, Maximize2, Layers, CheckSquare, Square, AlertCircle, Filter } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi, type SlotItem, type PillarItem, type LocationItem, type SlotFormData } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import { formatFirebaseUrl } from '../../utils/firebaseUrl';
import clsx from 'clsx';

const emptyForm: SlotFormData = {
  slotNumber: '',
  status: 'AVAILABLE',
  price: 500000,
  area: 3.0,
  locationId: undefined,
  pillarIds: [],
  imageUrl: '',
};

export default function SlotManagement() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [pillars, setPillars] = useState<PillarItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<number | 'all'>('all');
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SlotItem | null>(null);
  const [form, setForm] = useState<SlotFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState<SlotItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [s, p, l] = await Promise.all([
        managerApi.getSlots(),
        managerApi.getPillars(),
        managerApi.getLocations(),
      ]);
      setSlots(Array.isArray(s) ? s : []);
      setPillars(Array.isArray(p) ? p : []);
      setLocations(Array.isArray(l) ? l : []);
    } catch {
      setError('Không thể tải dữ liệu ô vườn hoặc trụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tính toán diện tích yêu cầu, tổng số hốc và tổng giá từ các trụ đã chọn
  const selectedPillarsDetails = useMemo(() => {
    return pillars.filter(p => form.pillarIds.includes(p.id));
  }, [pillars, form.pillarIds]);

  const totalRequiredArea = useMemo(() => {
    return selectedPillarsDetails.reduce((sum, p) => {
      const req = p.requiredArea || (p.pillarType === 'LARGE' ? 2.0 : p.pillarType === 'SMALL' ? 1.0 : 1.5);
      return sum + req;
    }, 0);
  }, [selectedPillarsDetails]);

  const totalHoles = useMemo(() => {
    return selectedPillarsDetails.reduce((sum, p) => {
      const holes = p.capacityHoles || (p.pillarType === 'LARGE' ? 48 : p.pillarType === 'SMALL' ? 24 : 36);
      return sum + holes;
    }, 0);
  }, [selectedPillarsDetails]);

  const autoCalculatedPrice = useMemo(() => {
    return selectedPillarsDetails.reduce((sum, p) => {
      const price = p.price || (p.pillarType === 'LARGE' ? 300000 : p.pillarType === 'SMALL' ? 150000 : 200000);
      return sum + price;
    }, 0);
  }, [selectedPillarsDetails]);

  // Tập hợp các ID trụ đã bị chiếm bởi các ô vườn khác
  const occupiedPillarIds = useMemo(() => {
    const set = new Set<number>();
    slots.forEach(s => {
      if (editing && s.id === editing.id) return;
      if (s.pillarIds && Array.isArray(s.pillarIds)) {
        s.pillarIds.forEach(id => set.add(id));
      } else if (s.pillarId) {
        set.add(s.pillarId);
      }
    });
    return set;
  }, [slots, editing]);

  // Danh sách các trụ hợp lệ có thể chọn cho ô vườn hiện tại
  const availablePillarsForForm = useMemo(() => {
    return pillars.filter(p => {
      if (form.locationId && p.locationId && p.locationId !== form.locationId) {
        return false;
      }
      return !occupiedPillarIds.has(p.id);
    });
  }, [pillars, form.locationId, occupiedPillarIds]);

  const openCreate = () => {
    setEditing(null);
    setError('');
    setFormError('');
    const defaultLocId = locations[0]?.id;
    setForm({
      ...emptyForm,
      locationId: defaultLocId,
      pillarIds: [],
    });
    setShowForm(true);
  };

  const openEdit = async (s: SlotItem) => {
    setError('');
    setFormError('');
    setEditing(s);
    setShowForm(true);
    setLoadingDetail(true);

    try {
      const freshSlot: SlotItem = await managerApi.getSlot(s.id);
      setEditing(freshSlot);

      const pIds = freshSlot.pillarIds && freshSlot.pillarIds.length > 0
        ? freshSlot.pillarIds
        : (freshSlot.pillarId ? [freshSlot.pillarId] : []);

      setForm({
        slotNumber: freshSlot.slotNumber,
        status: freshSlot.status || 'AVAILABLE',
        price: freshSlot.price || 500000,
        area: freshSlot.area || 3.0,
        locationId: freshSlot.locationId || locations[0]?.id,
        pillarIds: pIds,
        imageUrl: freshSlot.imageUrl || '',
      });
    } catch {
      setError('Không thể tải thông tin chi tiết ô vườn từ máy chủ.');
      setShowForm(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const togglePillarSelection = (pillarId: number) => {
    setFormError('');
    setForm(prev => {
      const exists = prev.pillarIds.includes(pillarId);
      if (exists) {
        return { ...prev, pillarIds: prev.pillarIds.filter(id => id !== pillarId) };
      } else {
        const pillarToAdd = pillars.find(p => p.id === pillarId);
        const addedArea = pillarToAdd ? (pillarToAdd.requiredArea || (pillarToAdd.pillarType === 'LARGE' ? 2.0 : pillarToAdd.pillarType === 'SMALL' ? 1.0 : 1.5)) : 1.5;
        const currentReq = selectedPillarsDetails.reduce((sum, p) => sum + (p.requiredArea || 1.5), 0);
        
        if (currentReq + addedArea > prev.area) {
          setFormError(`Ô vườn diện tích ${prev.area} m² không đủ chỗ cho trụ này (cần tối thiểu ${(currentReq + addedArea).toFixed(1)} m²). Vui lòng tăng diện tích ô vườn nếu muốn chọn thêm.`);
          return prev;
        }
        return { ...prev, pillarIds: [...prev.pillarIds, pillarId] };
      }
    });
  };

  const handleAreaChange = (val: number) => {
    setFormError('');
    const validArea = Math.max(0.5, Number(val) || 1.0);
    setForm(prev => ({
      ...prev,
      area: validArea,
    }));
  };

  const applyAutoPrice = () => {
    if (autoCalculatedPrice > 0) {
      setForm(f => ({ ...f, price: autoCalculatedPrice }));
      setFormError('');
    }
  };

  const handleSubmit = async () => {
    if (!form.slotNumber?.trim()) {
      setFormError('Vui lòng nhập Mã ô vườn.');
      return;
    }
    if (!form.area || form.area <= 0) {
      setFormError('Diện tích ô vườn phải lớn hơn 0 m².');
      return;
    }
    if (form.pillarIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 trụ canh tác cho ô vườn này.');
      return;
    }
    if (totalRequiredArea > form.area) {
      setFormError(`Ô vườn diện tích ${form.area} m² không đủ chỗ cho các trụ đã chọn (cần tối thiểu ${totalRequiredArea.toFixed(1)} m² theo quy chuẩn không gian từng loại trụ: Nhỏ 1.0 m², Vừa 1.5 m², Lớn 2.0 m²).`);
      return;
    }
    if (isNaN(form.price) || form.price < 1000 || form.price % 1000 !== 0) {
      setFormError('Giá thuê không hợp lệ: Tối thiểu 1.000 VNĐ và phải là bội số của 1.000.');
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      if (editing) {
        await managerApi.updateSlot(editing.id, form);
      } else {
        await managerApi.createSlot(form);
      }
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Lưu ô vườn thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setError('');
    try {
      await managerApi.deleteSlot(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Xóa thất bại. Ô vườn có thể đang có hợp đồng thuê hoạt động.');
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const statusConfig: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Trống', cls: 'bg-green-100 text-green-700' },
    RENTED: { label: 'Đang thuê', cls: 'bg-blue-100 text-blue-700' },
    MAINTENANCE: { label: 'Bảo trì', cls: 'bg-yellow-100 text-yellow-700' },
    INACTIVE: { label: 'Ngưng', cls: 'bg-gray-100 text-gray-600' },
  };

  const filtered = slots.filter(s => {
    const matchSearch = s.slotNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.locationName && s.locationName.toLowerCase().includes(search.toLowerCase())) ||
      (s.pillarCodes && s.pillarCodes.some(c => c.toLowerCase().includes(search.toLowerCase())));
    const matchLoc = locationFilter === 'all' || s.locationId === locationFilter;
    return matchSearch && matchLoc;
  });

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Ô vườn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã ô, mã trụ, cơ sở..."
              className="input pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              className="input py-2 text-sm"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Tất cả cơ sở ({locations.length})</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm ô vườn
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span>Đang tải danh sách ô vườn...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Không tìm thấy ô vườn nào</p>
          <p className="text-xs text-gray-400 mt-1">Bấm "Thêm ô vườn" để tạo mới hoặc chọn bộ lọc khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => {
            const st = statusConfig[s.status] || statusConfig.INACTIVE;
            const slotArea = s.area || 3.0;
            const codes = s.pillarCodes && s.pillarCodes.length > 0
              ? s.pillarCodes
              : (s.pillarId ? [`#${s.pillarId}`] : []);

            return (
              <div key={s.id} className="card hover:border-green-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
                <div>
                  {s.imageUrl && (
                    <img
                      src={formatFirebaseUrl(s.imageUrl)}
                      alt={s.slotNumber}
                      className="w-full h-32 object-cover rounded-xl mb-3 -mt-1"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                      <Grid3X3 className="w-5 h-5" />
                    </div>
                    <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-medium', st.cls)}>{st.label}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg">{s.slotNumber}</h3>
                  {s.locationName && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" /> {s.locationName}
                    </p>
                  )}

                  {/* Diện tích & Năng suất hốc trồng */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100 text-xs">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <span className="text-gray-400 block text-[11px]">Diện tích</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Maximize2 className="w-3 h-3 text-emerald-600" /> {slotArea} m²
                      </span>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl">
                      <span className="text-emerald-700 block text-[11px] font-medium">Năng suất</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-emerald-600" /> {s.totalHoles || (codes.length * 36)} hốc rau
                      </span>
                    </div>
                  </div>

                  {/* Danh sách các Trụ */}
                  <div className="mt-3">
                    <span className="text-xs text-gray-400 block mb-1 font-medium">Trụ canh tác ({codes.length} trụ):</span>
                    {codes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {codes.map((code, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Chưa gán trụ nào</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center text-emerald-700 font-bold text-base">
                    <DollarSign className="w-4 h-4 -mr-0.5" />
                    {Number(s.price || 0).toLocaleString('vi-VN')}đ
                    <span className="text-xs text-gray-400 font-normal ml-0.5">/tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(s)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Xóa ô vườn?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc muốn xóa ô vườn <span className="font-semibold text-gray-900">"{confirmDelete.slotNumber}"</span>? Các trụ bên trong sẽ được tự động giải phóng để dùng cho ô khác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? 'Đang xóa...' : 'Xóa ô vườn'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary rounded-xl">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Ô Vườn */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Sửa Ô Vườn' : 'Thêm Ô Vườn Mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm">Đang tải chi tiết ô vườn...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3.5 text-xs flex items-start gap-2.5 font-medium leading-relaxed shadow-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label font-medium text-gray-700">Mã ô vườn *</label>
                    <input
                      className="input rounded-xl"
                      value={form.slotNumber}
                      onChange={e => { setForm(f => ({ ...f, slotNumber: e.target.value })); setFormError(''); }}
                      placeholder="VD: S-Q1-03"
                    />
                  </div>
                  <div>
                    <label className="label font-medium text-gray-700">Cơ sở *</label>
                    <select
                      className="input rounded-xl"
                      value={form.locationId || locations[0]?.id}
                      onChange={e => {
                        const newLocId = Number(e.target.value);
                        setForm(f => ({ ...f, locationId: newLocId, pillarIds: [] }));
                        setFormError('');
                      }}
                      disabled={!!editing}
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diện tích & Quy tắc sức chứa */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Maximize2 className="w-4 h-4 text-emerald-700" /> Diện tích ô vườn (m²) *
                    </label>
                    <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                      Diện tích hiện tại: {form.area || 0} m²
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    className="input bg-white rounded-xl font-bold text-gray-900"
                    value={form.area || ''}
                    onChange={e => handleAreaChange(parseFloat(e.target.value))}
                    placeholder="VD: 5.0 (m²)"
                  />
                  <p className="text-[11px] text-emerald-800 mt-2 font-medium">
                    💡 Quy chuẩn không gian theo kích thước từng loại trụ: <strong>Trụ Nhỏ: 1.0 m² (24 hốc)</strong>, <strong>Trụ Vừa: 1.5 m² (36 hốc)</strong>, <strong>Trụ Lớn: 2.0 m² (48 hốc)</strong>.
                  </p>
                </div>

                {/* Chọn nhiều Trụ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0 font-medium text-gray-700">Chọn các Trụ canh tác *</label>
                    <span className={clsx(
                      'text-xs font-bold px-2.5 py-1 rounded-lg border',
                      totalRequiredArea > form.area
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    )}>
                      Cần: {totalRequiredArea.toFixed(1)} / {form.area} m² ({form.pillarIds.length} trụ - {totalHoles} hốc)
                    </span>
                  </div>

                  {availablePillarsForForm.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 text-center text-xs text-gray-400">
                      Không có trụ trống nào thuộc cơ sở này. Vui lòng thêm trụ mới ở mục Quản lý Trụ trước.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50/50">
                      {availablePillarsForForm.map(p => {
                        const isSelected = form.pillarIds.includes(p.id);
                        const isSmall = p.pillarType === 'SMALL';
                        const isLarge = p.pillarType === 'LARGE';
                        const reqArea = p.requiredArea || (isLarge ? 2.0 : isSmall ? 1.0 : 1.5);
                        const holes = p.capacityHoles || (isLarge ? 48 : isSmall ? 24 : 36);
                        const price = p.price || (isLarge ? 300000 : isSmall ? 150000 : 200000);

                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePillarSelection(p.id)}
                            className={clsx(
                              'flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border text-xs',
                              isSelected
                                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium shadow-xs ring-1 ring-emerald-500/20'
                                : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-700'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{p.pillarCode}</span>
                                  <span className={clsx(
                                    'text-[10px] px-1.5 py-0.2 rounded font-semibold',
                                    isLarge ? 'bg-purple-100 text-purple-700' :
                                    isSmall ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-blue-100 text-blue-700'
                                  )}>
                                    {p.pillarTypeName || (isLarge ? 'Trụ Lớn' : isSmall ? 'Trụ Nhỏ' : 'Trụ Vừa')} ({holes} hốc)
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  Chiếm: {reqArea} m² • {price.toLocaleString('vi-VN')} đ/tháng {p.defaultTreeName && `• Giống: ${p.defaultTreeName}`}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                              +{price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tự động tính giá và áp dụng */}
                {selectedPillarsDetails.length > 0 && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-blue-900 font-bold block">Tổng giá trụ gợi ý:</span>
                      <span className="text-blue-700">{selectedPillarsDetails.length} trụ = <strong>{autoCalculatedPrice.toLocaleString('vi-VN')} VNĐ/tháng</strong> ({totalHoles} hốc rau)</span>
                    </div>
                    <button
                      type="button"
                      onClick={applyAutoPrice}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0"
                    >
                      Áp dụng giá này
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label font-medium text-gray-700">Giá thuê Ô Vườn (VNĐ/tháng) *</label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      className="input rounded-xl font-bold text-green-700"
                      value={form.price || ''}
                      onChange={e => {
                        setForm(f => ({ ...f, price: Math.max(0, Math.floor(Number(e.target.value))) }));
                        setFormError('');
                      }}
                      placeholder="VD: 500000"
                    />
                  </div>
                  <div>
                    <label className="label font-medium text-gray-700">Trạng thái</label>
                    <select
                      className="input rounded-xl"
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="AVAILABLE">Trống (Sẵn sàng)</option>
                      <option value="RENTED">Đang thuê</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-1.5 font-medium text-gray-700">
                    <ImageIcon className="w-3.5 h-3.5" /> Ảnh ô vườn (URL)
                  </label>
                  <input
                    className="input rounded-xl"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="Dán URL hình ảnh..."
                  />
                  {form.imageUrl && (
                    <img
                      src={formatFirebaseUrl(form.imageUrl)}
                      alt="Xem trước"
                      className="mt-2 w-full h-28 object-cover rounded-2xl border border-gray-100"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || totalRequiredArea > form.area}
                    className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? 'Đang lưu...' : editing ? 'Cập nhật Ô Vườn' : 'Tạo Ô Vườn'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-secondary px-5">Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}