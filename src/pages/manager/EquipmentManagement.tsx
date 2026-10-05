import React, { useState, useEffect, useRef } from 'react';
import { equipmentApi, Equipment } from '../../api/equipmentApi';
import { managerApi } from '../../api/managerApi';
import {
  Wrench, Plus, Edit2, Trash2, X, Search, Filter,
  Loader2, Calendar, ShieldCheck, ChevronDown,
  Upload, Image as ImageIcon, Hash, Layers, MapPin, Package, PackageMinus
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { Toast, ToastData } from '../../components/common/Toast';
import { staffNavItems } from './staffNav';
import { formatFirebaseUrl } from '../../utils/firebaseUrl';
import { uploadEquipmentImage } from '../../utils/firebaseUpload';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';
import apiClient from '../../api/axiosConfig';

// Component CustomDropdown bo tròn rounded-xl
function CustomDropdown({ icon, value, onChange, options, placeholder = 'Chọn', className }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt: any) => String(opt.value) === String(value))?.label || placeholder;

  return (
    <div className={clsx("relative inline-block text-left", className)} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 bg-white border rounded-xl px-3.5 py-2 text-sm shadow-sm cursor-pointer select-none transition-all duration-200",
          isOpen ? "border-green-500 ring-2 ring-green-500/10 text-green-700" : "border-gray-200 hover:border-green-500/50 text-gray-700"
        )}
      >
        {icon}
        <span className="font-medium pr-2 whitespace-nowrap">{selectedLabel}</span>
        <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform duration-200 ml-auto shrink-0", isOpen && "rotate-180 text-green-600")} />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 min-w-[180px] w-full bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {options.map((opt: any) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={clsx(
                  "px-3.5 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between",
                  isSelected ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const emptyForm: Partial<Equipment> = {
  equipmentName: '',
  serialNumber: '',
  description: '',
  status: 'AVAILABLE',
  pillarId: undefined,
  purchaseDate: '',
  lastMaintenanceDate: '',
  imageUrl: '',
  quantity: 1,
};

export default function EquipmentManagement() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Nhập thêm kho (+N)
  const [stockModalItem, setStockModalItem] = useState<Equipment | null>(null);
  const [stockAddQty, setStockAddQty] = useState<number>(5);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Cơ sở (location) của từng pillar — dùng để suy ra cơ sở của từng thiết bị và lọc theo cơ sở
  const pillarLocationMap = React.useMemo(() => {
    const map = new Map<number, number>();
    pillars.forEach((p: any) => { if (p.locationId != null) map.set(p.id, p.locationId); });
    return map;
  }, [pillars]);

  const locationNameMap = React.useMemo(() => {
    const map = new Map<number, string>();
    locations.forEach((l: any) => map.set(l.id, l.name));
    return map;
  }, [locations]);

  // Chỉ manager/admin mới cần chọn cơ sở (location_manager chỉ có đúng 1 cơ sở, backend đã tự lọc sẵn)
  const canFilterByLocation = (user?.role === 'manager' || user?.role === 'admin') && locations.length > 0;

  const pillarOptionsForLocation = selectedLocationId
    ? pillars.filter((p: any) => String(p.locationId) === selectedLocationId)
    : pillars;

  // Giá trị đặc biệt: Manager thêm thiết bị cho tất cả cơ sở cùng lúc
  const ALL_LOCATIONS = 'ALL';

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<Partial<Equipment>>(emptyForm);
  const [formLocationId, setFormLocationId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Trụ vườn khả dụng trong form Thêm/Sửa, lọc theo cơ sở đang chọn trong form
  const formPillarOptions = formLocationId
    ? pillars.filter((p: any) => String(p.locationId) === formLocationId)
    : pillars;

  const handleFormLocationChange = (locId: string) => {
    setFormLocationId(locId);
    const currentPillar = pillars.find((p: any) => String(p.id) === String(formData.pillarId));
    if (locId && (!currentPillar || String(currentPillar.locationId) !== locId)) {
      setFormData(prev => ({ ...prev, pillarId: undefined }));
    }
  };

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unbind to Warehouse State
  const [confirmUnbind, setConfirmUnbind] = useState<Equipment | null>(null);
  const [isUnbinding, setIsUnbinding] = useState(false);

  const handleUnbind = async () => {
    if (!confirmUnbind) return;
    setIsUnbinding(true);
    try {
      const targetLoc = confirmUnbind.locationId ?? (confirmUnbind.pillarId ? pillarLocationMap.get(confirmUnbind.pillarId) : undefined);
      await equipmentApi.updateEquipment(confirmUnbind.id, {
        ...confirmUnbind,
        pillarId: null as any,
        locationId: targetLoc,
        status: 'AVAILABLE',
      });
      showToast('success', 'Đã tháo thiết bị về kho', `Thiết bị "${confirmUnbind.equipmentName}" đã được gỡ khỏi trụ và hoàn về kho sẵn sàng sử dụng.`);
      setConfirmUnbind(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Thao tác thất bại', err?.response?.data?.message || 'Không thể tháo thiết bị về kho.');
    } finally {
      setIsUnbinding(false);
    }
  };

  // State quản lý loading khi upload ảnh lên Backend API
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Toast thông báo
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = (type: ToastData['type'], title: string, detail?: string) => setToast({ type, title, detail });

  // Xử lý khi chọn file hình từ máy -> upload thẳng lên Firebase Storage (client-side)
  // Lưu ý: không dùng equipmentApi.uploadImage() (backend) vì endpoint đó tạo file không public,
  // link trả về luôn bị 403 Forbidden khi tải lại
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('warning', 'Định dạng ảnh không hợp lệ', 'Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Ảnh quá lớn', 'Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const firebaseUrl = await uploadEquipmentImage(file);
      setFormData(prev => ({ ...prev, imageUrl: firebaseUrl }));
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      showToast('error', 'Tải ảnh thất bại', 'Không thể tải ảnh lên Firebase. Vui lòng thử lại!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = selectedPillarId
          ? await apiClient.get(`/equipment/pillar/${selectedPillarId}`).then((r: any) => r.data)
          : await equipmentApi.getEquipments();
      setEquipments(data || []);

      if (pillars.length === 0) {
          const pillarsData = await managerApi.getPillars();
          setPillars(pillarsData || []);
      }
    } catch (err) {
      setError('Không thể tải danh sách thiết bị.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedPillarId]);

  // Tải danh sách cơ sở để hiển thị tên cơ sở và lọc thiết bị
  useEffect(() => {
    managerApi.getLocations().then((res: any) => setLocations(res || [])).catch((err: any) => {
      console.error('Không thể tải danh sách cơ sở:', err);
    });
  }, []);

  // Đổi cơ sở thì reset lại trụ đang chọn nếu trụ đó không thuộc cơ sở mới
  const handleLocationChange = (locId: string) => {
    setSelectedLocationId(locId);
    if (selectedPillarId && locId) {
      const pillar = pillars.find((p: any) => String(p.id) === selectedPillarId);
      if (!pillar || String(pillar.locationId) !== locId) {
        setSelectedPillarId('');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setError('');
    setFormData(emptyForm);
    if (user?.role === 'location_manager' && user?.locationId) {
      setFormLocationId(String(user.locationId));
    } else {
      setFormLocationId(locations[0]?.id ? String(locations[0].id) : '');
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Equipment) => {
    setError('');
    setEditingItem(item);
    setFormData(emptyForm);
    const itemLoc = item.locationId ?? (item.pillarId ? pillarLocationMap.get(item.pillarId) : undefined);
    setFormLocationId(itemLoc != null ? String(itemLoc) : (user?.locationId ? String(user.locationId) : ''));
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      const freshData = await equipmentApi.getEquipment(item.id);
      setEditingItem(freshData);
      const freshLoc = freshData.locationId ?? (freshData.pillarId ? pillarLocationMap.get(freshData.pillarId) : undefined);
      setFormLocationId(freshLoc != null ? String(freshLoc) : (user?.locationId ? String(user.locationId) : ''));
      // Backend trả về LocalDateTime đầy đủ (VD "2026-01-27T13:36:08.34"), nhưng input type="date"
      // chỉ hiểu đúng "YYYY-MM-DD" — cắt bớt phần giờ để hiển thị đúng trên form
      setFormData({
        ...freshData,
        purchaseDate: freshData.purchaseDate?.slice(0, 10),
        lastMaintenanceDate: freshData.lastMaintenanceDate?.slice(0, 10),
      });
    } catch (err) {
      setError('Không thể tải chi tiết thiết bị từ máy chủ.');
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleUpdateStock = async () => {
    if (!stockModalItem) return;
    if (!stockAddQty || stockAddQty <= 0 || !Number.isInteger(Number(stockAddQty))) {
      showToast('warning', 'Số lượng không hợp lệ', 'Số lượng nhập thêm phải là số nguyên lớn hơn 0.');
      return;
    }
    setIsUpdatingStock(true);
    try {
      const updated = await equipmentApi.updateStock(stockModalItem.id, Number(stockAddQty));
      showToast('success', 'Nhập kho thành công', `Đã cộng thêm ${stockAddQty} cái vào kho thiết bị "${updated.equipmentName}".`);
      setStockModalItem(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Lỗi nhập kho', err.response?.data?.message || 'Không thể cập nhật số lượng tồn kho.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentName?.trim()) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập Tên thiết bị.');
      return;
    }
    if (formData.quantity == null || formData.quantity < 0 || !Number.isInteger(Number(formData.quantity))) {
      showToast('warning', 'Số lượng không hợp lệ', 'Số lượng thiết bị trong kho phải là số nguyên không âm (≥ 0).');
      return;
    }
    if (!formData.serialNumber?.trim()) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập Mã thiết bị (Serial Number) để liên kết cảm biến.');
      return;
    }

    const isAllLocations = !editingItem && formLocationId === ALL_LOCATIONS;
    const targetLocationId = isAllLocations
      ? undefined
      : formLocationId
        ? Number(formLocationId)
        : (user?.locationId ? Number(user.locationId) : undefined);

    if (!isAllLocations && !formData.pillarId && !targetLocationId) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng chọn Cơ sở quản lý thiết bị này.');
      return;
    }

    // Input type="date" trả về "YYYY-MM-DD", nhưng backend nhận LocalDateTime — cần thêm giờ (T00:00:00)
    // hoặc bỏ hẳn field nếu rỗng, nếu không Jackson sẽ parse lỗi và trả về 400
    const toLocalDateTime = (date?: string) => (date ? `${date}T00:00:00` : undefined);
    const payload = {
      ...formData,
      pillarId: formData.pillarId ? Number(formData.pillarId) : null,
      locationId: targetLocationId,
      purchaseDate: toLocalDateTime(formData.purchaseDate),
      lastMaintenanceDate: toLocalDateTime(formData.lastMaintenanceDate),
    };

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await equipmentApi.updateEquipment(editingItem.id, payload);
      } else if (isAllLocations) {
        // Kho chung "Tất cả cơ sở": không gắn cơ sở, trụ ở cơ sở nào cũng lấy được
        await equipmentApi.createEquipment({ ...payload, pillarId: null, status: 'AVAILABLE', locationId: undefined });
      } else {
        await equipmentApi.createEquipment(payload);
      }
      showToast('success', editingItem
        ? 'Cập nhật thiết bị thành công!'
        : isAllLocations ? 'Đã thêm thiết bị vào kho chung cho tất cả cơ sở!' : 'Thêm thiết bị mới thành công!');
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error('Lỗi lưu thiết bị:', err);
      const msg = err?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.';
      showToast('error', 'Thao tác thất bại', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await equipmentApi.deleteEquipment(confirmDelete.id);
      setConfirmDelete(null);
      showToast('success', 'Đã xóa thiết bị');
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thiết bị này có thể đang ràng buộc với dữ liệu khác.';
      showToast('error', 'Xóa thất bại', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEquipments = equipments
    .filter(item => {
      const matchSearch = item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
                          item.serialNumber?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '' ? true : item.status === statusFilter;
      const itemLoc = item.locationId ?? (item.pillarId ? pillarLocationMap.get(item.pillarId) : undefined);
      const matchLocation = selectedLocationId === ''
        ? true
        : String(itemLoc) === selectedLocationId;
      const matchPillar = selectedPillarId === ''
        ? true
        : String(item.pillarId) === selectedPillarId;
      return matchSearch && matchStatus && matchLocation && matchPillar;
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredEquipments.length / pageSize) || 1;
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Danh mục Thiết bị">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div className="p-6 max-w-7xl mx-auto">

        {/* Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[260px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên thiết bị, Serial Number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-all outline-none"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <CustomDropdown
              icon={<Filter className="w-4 h-4 text-green-600 shrink-0" />}
              value={statusFilter}
              onChange={(val: any) => {
                setStatusFilter(String(val));
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "AVAILABLE", label: "Sẵn sàng trong kho" },
                { value: "IN_USE", label: "Đang sử dụng trên trụ" },
                { value: "MAINTENANCE", label: "Tạm ngưng / Bảo trì" },
                { value: "BROKEN", label: "Hỏng / Thanh lý" },
              ]}
            />

            {/* Location Filter (chỉ manager/admin — location_manager đã bị giới hạn 1 cơ sở sẵn ở Backend) */}
            {canFilterByLocation && (
              <CustomDropdown
                icon={<MapPin className="w-4 h-4 text-green-600 shrink-0" />}
                value={selectedLocationId}
                onChange={(val: any) => {
                  handleLocationChange(String(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "Tất cả cơ sở" },
                  ...locations.map((l: any) => ({ value: String(l.id), label: l.name }))
                ]}
              />
            )}

            {/* Pillar Filter */}
            <CustomDropdown
              icon={<Layers className="w-4 h-4 text-green-600 shrink-0" />}
              value={selectedPillarId}
              onChange={(val: any) => {
                setSelectedPillarId(String(val));
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "Tất cả các trụ" },
                ...pillarOptionsForLocation.map(p => ({ value: String(p.id), label: p.pillarName || p.pillarCode || `Trụ #${p.id}` }))
              ]}
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm shadow-green-600/20 transition whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm thiết bị
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Thiết bị & Serial</th>
                <th className="p-4 font-semibold text-gray-600">Số lượng tồn</th>
                <th className="p-4 font-semibold text-gray-600">Khu vực (Pillar)</th>
                <th className="p-4 font-semibold text-gray-600">Ngày mua / Bảo trì gần nhất</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải danh sách thiết bị...</td></tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy thiết bị nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                paginatedEquipments.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 overflow-hidden font-bold text-xs">
                          {item.imageUrl ? (
                            <img src={formatFirebaseUrl(item.imageUrl)} alt={item.equipmentName} className="w-full h-full object-cover" />
                          ) : (
                            <Wrench className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.equipmentName}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Hash className="w-3 h-3" />
                            {item.serialNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 min-w-[100px]">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>{Number(item.quantity ?? 1).toLocaleString('vi-VN')} cái</span>
                        </div>
                        <div>
                          {(item.quantity ?? 1) <= 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Hết kho
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Còn kho
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setStockModalItem(item);
                            setStockAddQty(5);
                          }}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline mt-0.5"
                        >
                          <Plus className="w-3 h-3" /> Nhập thêm
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-700 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-gray-400" />
                        {item.status === 'IN_USE' && item.pillarId ? (item.pillarCode ? `Trụ: ${item.pillarCode}` : `Trụ #${item.pillarId}`) : <span className="text-gray-500 italic">Cất kho (Chưa gắn trụ)</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {item.locationName || locationNameMap.get(item.locationId ?? -1) || (item.pillarId ? locationNameMap.get(pillarLocationMap.get(item.pillarId) ?? -1) : undefined) || 'Tất cả cơ sở'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" /> 
                          Mua: {item.purchaseDate || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> 
                          Bảo trì: {item.lastMaintenanceDate || 'Chưa có'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', {
                        'bg-green-100 text-green-700': item.status === 'AVAILABLE',
                        'bg-blue-100 text-blue-700': item.status === 'IN_USE',
                        'bg-amber-100 text-amber-700': item.status === 'MAINTENANCE',
                        'bg-red-100 text-red-700': item.status === 'BROKEN',
                      })}>
                        {item.status === 'AVAILABLE' && 'Sẵn sàng trong kho'}
                        {item.status === 'IN_USE' && 'Đang sử dụng trên trụ'}
                        {item.status === 'MAINTENANCE' && 'Tạm ngưng / Bảo trì'}
                        {item.status === 'BROKEN' && 'Hỏng / Thanh lý'}
                        {!['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'].includes(item.status) && item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {(() => {
                        const itemLoc = item.locationId ?? (item.pillarId ? pillarLocationMap.get(item.pillarId) : undefined);
                        const canManage = user?.role !== 'location_manager' || !user.locationId || itemLoc === user.locationId;
                        if (!canManage) {
                          return (
                            <span className="text-[11px] text-gray-400 italic">Chỉ xem</span>
                          );
                        }
                        return (
                          <div className="flex items-center justify-end gap-1">
                            {item.pillarId && (
                              <button
                                onClick={() => setConfirmUnbind(item)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Tháo thiết bị về kho (Gỡ khỏi trụ)"
                              >
                                <PackageMinus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                              title="Chỉnh sửa thiết bị"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Xóa thiết bị"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredEquipments.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEquipments.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="thiết bị"
              />
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Xóa thiết bị?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Bạn có chắc muốn xóa thiết bị <span className="font-semibold text-gray-900">"{confirmDelete.equipmentName}"</span> (S/N: {confirmDelete.serialNumber})? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition shadow-sm shadow-red-600/20">
                  {isDeleting ? 'Đang xóa...' : 'Xóa ngay'}
                </button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition">Hủy</button>
              </div>
            </div>
          </div>
        )}

        {/* Unbind Confirmation Modal */}
        {confirmUnbind && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageMinus className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Tháo thiết bị về kho?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Bạn có chắc muốn tháo <span className="font-semibold text-gray-900">"{confirmUnbind.equipmentName}"</span> (S/N: {confirmUnbind.serialNumber}) khỏi trụ và hoàn về kho sẵn sàng cấp phát?
              </p>
              <div className="flex gap-3">
                <button onClick={handleUnbind} disabled={isUnbinding} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-xl transition shadow-sm shadow-amber-600/20">
                  {isUnbinding ? 'Đang tháo...' : 'Xác nhận tháo'}
                </button>
                <button onClick={() => setConfirmUnbind(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition">Hủy</button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-green-600" />
                {editingItem ? 'Cập nhật thông tin Thiết bị' : 'Thêm Thiết bị mới'}
              </h2>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <p className="text-sm">Đang tải thông số thiết bị từ máy chủ...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6 text-sm">
                  
{/* PHẦN 1: THÔNG TIN CƠ BẢN */}
<div>
  <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-3">
    1. Thông tin định danh Thiết bị
  </h3>
  
  {/* Đổi thành grid-cols-1 sm:grid-cols-2 và thêm ô Serial Number */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    
    {/* Ô 1: Tên thiết bị */}
    <div>
      <label className="block font-medium text-gray-700 mb-1">Tên thiết bị <span className="text-red-500">*</span></label>
      <input
        required
        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
        value={formData.equipmentName || ''}
        onChange={e => setFormData({...formData, equipmentName: e.target.value})}
        placeholder="VD: Mạch ESP32 Master"
      />
    </div>

    {/* Ô 2: Serial Number (THÊM MỚI QUAN TRỌNG) */}
    <div>
      <label className="block font-medium text-gray-700 mb-1">Mã thiết bị (Serial Number) <span className="text-red-500">*</span></label>
      <input
        required
        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition uppercase"
        value={formData.serialNumber || ''}
        onChange={e => setFormData({...formData, serialNumber: e.target.value})}
        placeholder="VD: S-Q1-03 (Khớp với code C++)"
      />
    </div>

    {/* Ô 3: Cơ sở */}
    {user?.role === 'location_manager' ? (
      <div>
        <label className="block font-medium text-gray-700 mb-1">
          Cơ sở <span className="text-xs text-emerald-600 font-normal">(Cố định theo cơ sở phân công)</span>
        </label>
        <div className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{locations.find((l: any) => l.id === user?.locationId)?.name || `Cơ sở #${user?.locationId}`}</span>
        </div>
      </div>
    ) : canFilterByLocation ? (
      <div>
        <label className="block font-medium text-gray-700 mb-1">Cơ sở <span className="text-red-500">*</span></label>
        <CustomDropdown
          icon={<MapPin className="w-4 h-4 text-green-600 shrink-0" />}
          value={formLocationId}
          onChange={(val: any) => handleFormLocationChange(String(val))}
          options={[
            ...(!editingItem ? [{ value: ALL_LOCATIONS, label: 'Tất cả cơ sở' }] : []),
            ...locations.map((l: any) => ({ value: String(l.id), label: l.name })),
          ]}
          placeholder="Chọn cơ sở"
          className="w-full"
        />
        {formLocationId === ALL_LOCATIONS && !editingItem && (
          <p className="text-[11px] text-emerald-700 mt-1">
            Thiết bị vào kho chung: trụ ở cơ sở nào cũng lấy được. Thiết bị của 1 cơ sở cụ thể thì chỉ trụ thuộc cơ sở đó mới lấy được.
          </p>
        )}
      </div>
    ) : null}

    {/* Ô 4: Trụ Vườn */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-medium text-gray-700">Gắn vào Trụ vườn</label>
        {formData.pillarId && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, pillarId: undefined, status: 'AVAILABLE' }))}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline flex items-center gap-1"
          >
            <PackageMinus className="w-3.5 h-3.5" /> Tháo về kho
          </button>
        )}
      </div>
      <CustomDropdown
        icon={<Layers className="w-4 h-4 text-green-600 shrink-0" />}
        value={formData.pillarId ?? ''}
        onChange={(val: any) => {
          const pid = val ? Number(val) : undefined;
          setFormData(prev => ({
            ...prev,
            pillarId: pid,
            status: pid ? 'IN_USE' : 'AVAILABLE'
          }));
        }}
        options={[
          { value: '', label: 'Cất kho (Chưa gắn vào trụ nào)' },
          ...formPillarOptions.map((p: any) => ({
            value: String(p.id),
            label: p.pillarName ? `${p.pillarName}${p.pillarCode ? ` (${p.pillarCode})` : ''}` : (p.pillarCode || `Trụ #${p.id}`),
          }))
        ]}
        placeholder={canFilterByLocation && !formLocationId ? 'Chọn cơ sở trước' : 'Chọn trụ vườn (Để trống nếu cất kho)'}
        className="w-full"
      />
    </div>

    {/* Ô 5: Số lượng thiết bị */}
    <div>
      <label className="block font-medium text-gray-700 mb-1">Số lượng trong kho (cái/bộ) <span className="text-red-500">*</span></label>
      <input
        type="number"
        min={0}
        step={1}
        required
        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
        value={formData.quantity ?? 1}
        onChange={e => setFormData({...formData, quantity: Math.floor(Math.max(0, Number(e.target.value) || 0))})}
        placeholder="VD: 10"
      />
      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
        <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        Số lượng tồn kho (tự động giảm khi nhân viên lấy lắp vào trụ).
      </p>
    </div>
  </div>
                    
                    {/* KHU VỰC UPLOAD ẢNH QUA API BACKEND */}
                    <div className="mt-4">
                      <label className="block font-medium text-gray-700 mb-1.5">Hình ảnh thiết bị</label>
                      
                      <div className="flex items-center gap-4">
                        {/* Box xem trước ảnh (Preview) */}
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                          {isUploadingImage ? (
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                          ) : formData.imageUrl ? (
                            <>
                              <img src={formatFirebaseUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ảnh"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* Nút chọn file từ máy */}
                        <div className="flex-1">
                          <label className={clsx(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm transition",
                            isUploadingImage && "opacity-50 pointer-events-none"
                          )}>
                            <Upload className="w-4 h-4 text-green-600" />
                            <span>{isUploadingImage ? 'Đang gửi ảnh...' : formData.imageUrl ? 'Gửi ảnh khác' : 'Gửi ảnh'}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageChange} 
                              disabled={isUploadingImage}
                              className="hidden" 
                            />
                          </label>
                          <p className="text-xs text-gray-400 mt-1.5">
                            Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB. Ảnh được upload trực tiếp lên Storage của Server.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 2: THỜI GIAN & TRẠNG THÁI */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
                      2. Lịch sử & Trạng thái Hoạt động
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Ngày mua</label>
                        <input
                          type="date"
                          max={new Date().toLocaleDateString('en-CA')}
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.purchaseDate || ''}
                          onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Ngày bảo trì gần nhất</label>
                        <input
                          type="date"
                          max={new Date().toLocaleDateString('en-CA')}
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.lastMaintenanceDate || ''}
                          onChange={e => setFormData({...formData, lastMaintenanceDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">Trạng thái thiết bị</label>
                      <select
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                        value={formData.status || 'AVAILABLE'}
                        onChange={e => {
                          const newStatus = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            status: newStatus,
                            pillarId: (newStatus === 'AVAILABLE' || newStatus === 'MAINTENANCE' || newStatus === 'BROKEN') ? undefined : prev.pillarId
                          }));
                        }}
                      >
                        <option value="AVAILABLE">Sẵn sàng trong kho (Available)</option>
                        <option value="MAINTENANCE">Tạm ngưng / Bảo trì (Maintenance)</option>
                        <option value="IN_USE">Đang sử dụng trên trụ (In use)</option>
                        <option value="BROKEN">Hỏng / Thanh lý (Broken)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Mô tả thiết bị / Ghi chú</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Nhập thông tin chi tiết về thiết bị..."
                      />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || isUploadingImage} 
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition shadow-sm shadow-green-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu...' : isUploadingImage ? 'Chờ upload ảnh...' : editingItem ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal Nhập thêm số lượng thiết bị vào kho */}
        {stockModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setStockModalItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Nhập thêm thiết bị vào kho
              </h2>

              <p className="text-xs text-gray-600 mb-4">
                Thiết bị: <strong className="text-gray-900">{stockModalItem.equipmentName}</strong> (SN: {stockModalItem.serialNumber || 'N/A'}) • Tồn kho hiện tại: <span className="font-bold text-emerald-700">{stockModalItem.quantity ?? 1} cái/bộ</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số lượng nhập thêm (+N): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-bold text-gray-900"
                    value={stockAddQty}
                    onChange={e => setStockAddQty(Math.floor(Math.max(1, Number(e.target.value) || 0)))}
                    placeholder="VD: 5"
                  />
                </div>

                <div className="flex gap-2">
                  {[2, 5, 10, 20].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStockAddQty(n)}
                      className={clsx(
                        "flex-1 py-1.5 rounded-lg border text-xs font-semibold transition",
                        stockAddQty === n ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      +{n}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-gray-500 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  Sau khi nhập, tồn kho mới sẽ là: <strong>{(stockModalItem.quantity ?? 1) + (stockAddQty || 0)} cái/bộ</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStockModalItem(null)}
                  disabled={isUpdatingStock}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-xs transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStock}
                  disabled={isUpdatingStock || !stockAddQty || stockAddQty <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingStock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Xác nhận nhập kho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}