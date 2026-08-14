import React, { useState, useEffect, useRef } from 'react';
import { equipmentApi, Equipment } from '../../api/equipmentApi';
import { managerApi } from '../../api/managerApi';
import { 
  Wrench, Plus, Edit2, Trash2, X, Search, Filter, 
  Loader2, Calendar, ShieldCheck, ChevronDown, 
  Upload, Image as ImageIcon, Hash, Layers
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import { formatFirebaseUrl } from '../../utils/firebaseUrl';
import { uploadEquipmentImage } from '../../utils/firebaseUpload';
import clsx from 'clsx';
import apiClient from '../../api/axiosConfig';

// 👉 Component CustomDropdown bo tròn rounded-xl
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
  pillarId: 1,
  purchaseDate: '',
  lastMaintenanceDate: '',
  imageUrl: '',
};

export default function EquipmentManagement() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<Partial<Equipment>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State quản lý loading khi upload ảnh lên Backend API
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 👉 Xử lý khi chọn file hình từ máy -> upload thẳng lên Firebase Storage (client-side)
  // Lưu ý: không dùng equipmentApi.uploadImage() (backend) vì endpoint đó tạo file không public,
  // link trả về luôn bị 403 Forbidden khi tải lại
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const firebaseUrl = await uploadEquipmentImage(file);
      setFormData(prev => ({ ...prev, imageUrl: firebaseUrl }));
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
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

  const handleOpenCreate = () => {
    setEditingItem(null);
    setError('');
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Equipment) => {
    setError('');
    setEditingItem(item);
    setFormData(emptyForm);
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      const freshData = await equipmentApi.getEquipment(item.id);
      setEditingItem(freshData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentName?.trim() || !formData.serialNumber?.trim()) {
      alert('Vui lòng nhập Tên thiết bị và Số Serial.');
      return;
    }

    // Input type="date" trả về "YYYY-MM-DD", nhưng backend nhận LocalDateTime — cần thêm giờ (T00:00:00)
    // hoặc bỏ hẳn field nếu rỗng, nếu không Jackson sẽ parse lỗi và trả về 400
    const toLocalDateTime = (date?: string) => (date ? `${date}T00:00:00` : undefined);
    const payload = {
      ...formData,
      purchaseDate: toLocalDateTime(formData.purchaseDate),
      lastMaintenanceDate: toLocalDateTime(formData.lastMaintenanceDate),
    };

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await equipmentApi.updateEquipment(editingItem.id, payload);
      } else {
        await equipmentApi.createEquipment(payload);
      }
      alert(editingItem ? 'Cập nhật thiết bị thành công!' : 'Thêm thiết bị mới thành công!');
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Lỗi lưu thiết bị:', err);
      alert('Thao tác thất bại. Vui lòng kiểm tra lại thông tin.');
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
      fetchData();
    } catch (err) {
      alert('Xóa thất bại. Thiết bị này có thể đang ràng buộc với dữ liệu khác.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEquipments = equipments.filter(item => {
    const matchSearch = item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
                        item.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Danh mục Thiết bị">
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
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <CustomDropdown
              icon={<Filter className="w-4 h-4 text-green-600 shrink-0" />}
              value={statusFilter}
              onChange={(val: any) => setStatusFilter(String(val))}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "AVAILABLE", label: "Sẵn sàng" },
                { value: "IN_USE", label: "Đang sử dụng" },
                { value: "MAINTENANCE", label: "Đang bảo trì" },
                { value: "BROKEN", label: "Hỏng" },
              ]}
            />

            {/* Pillar Filter */}
            <CustomDropdown
              icon={<Layers className="w-4 h-4 text-green-600 shrink-0" />}
              value={selectedPillarId}
              onChange={(val: any) => setSelectedPillarId(String(val))}
              options={[
                { value: "", label: "Tất cả các trụ" },
                ...pillars.map(p => ({ value: String(p.id), label: p.pillarName || `Trụ #${p.id}` }))
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
                <th className="p-4 font-semibold text-gray-600">Khu vực (Pillar)</th>
                <th className="p-4 font-semibold text-gray-600">Ngày mua / Bảo trì gần nhất</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải danh sách thiết bị...</td></tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy thiết bị nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredEquipments.map(item => (
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
                      <div className="font-medium text-gray-700 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-gray-400" />
                        {item.pillarCode ? `Pillar: ${item.pillarCode}` : `Pillar ID: ${item.pillarId}`}
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
                        {item.status === 'AVAILABLE' && 'Sẵn sàng'}
                        {item.status === 'IN_USE' && 'Đang sử dụng'}
                        {item.status === 'MAINTENANCE' && 'Đang bảo trì'}
                        {item.status === 'BROKEN' && 'Hỏng'}
                        {!['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'].includes(item.status) && item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                  
                  {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-3">
                      1. Thông tin định danh Thiết bị
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Tên thiết bị <span className="text-red-500">*</span></label>
                        <input
                          required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                          value={formData.equipmentName || ''}
                          onChange={e => setFormData({...formData, equipmentName: e.target.value})}
                          placeholder="VD: Máy bơm tự động 500W"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Số Serial Number <span className="text-red-500">*</span></label>
                        <input
                          required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-mono"
                          value={formData.serialNumber || ''}
                          onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                          placeholder="VD: SN-202409-001"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Pillar ID <span className="text-red-500">*</span></label>
                        <input
                          type="number" min={1} required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.pillarId ?? ''}
                          onChange={e => setFormData({...formData, pillarId: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Mã Pillar (Code)</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.pillarCode || ''}
                          onChange={e => setFormData({...formData, pillarCode: e.target.value})}
                          placeholder="VD: PIL-A01"
                        />
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
                            <span>{isUploadingImage ? 'Đang tải lên Server...' : 'Chọn ảnh từ máy...'}</span>
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
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="AVAILABLE">Sẵn sàng (Available)</option>
                        <option value="IN_USE">Đang sử dụng (In use)</option>
                        <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
                        <option value="BROKEN">Hỏng (Broken)</option>
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
      </div>
    </DashboardLayout>
  );
}