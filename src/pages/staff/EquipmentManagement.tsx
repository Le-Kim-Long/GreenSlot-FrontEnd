import React, { useState, useEffect, useRef } from 'react';
import { equipmentApi, Equipment } from '../../api/equipmentApi'; // Adjust import path
import { managerApi } from '../../api/managerApi';
import { Cpu, Plus, Edit2, Trash2, X, Search, Filter, Loader2, Calendar, Columns3, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface Pillar {
  id: number;
  pillarCode: string;
  locationId: number;
}

interface Option {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  icon?: React.ReactNode;
  value: string | number;
  onChange: (val: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

// 👉 Component Custom Dropdown: Giải pháp triệt để giúp menu thả xuống bo tròn rounded-xl tuyệt đẹp
function CustomDropdown({ icon, value, onChange, options, placeholder = 'Chọn', className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tự động đóng menu khi click chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => String(opt.value) === String(value))?.label || placeholder;

  return (
    <div className={clsx("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* Nút trigger */}
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

      {/* Popup Menu (Được bo tròn rounded-xl và đổ bóng mượt mà) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 min-w-[200px] w-full bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "px-3.5 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between",
                  isSelected 
                    ? "bg-green-50 text-green-700 font-semibold" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  equipmentName: '',
  serialNumber: '',
  description: '',
  status: 'AVAILABLE',
  pillarId: 0,
  pillarCode: '',
  purchaseDate: '',
  lastMaintenanceDate: '',
  imageUrl: ''
};

const statusOptions: Option[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'AVAILABLE', label: 'Hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'BROKEN', label: 'Hỏng hóc' },
];

export default function EquipmentManagement() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eqData, pillarData] = await Promise.all([
        equipmentApi.getEquipments().catch(() => []),
        managerApi.getPillars().catch(() => [])
      ]);
      setEquipments(eqData);
      setPillars(pillarData);
    } catch (err) {
      setError('Không thể tải dữ liệu thiết bị.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Xử lý mở Modal Tạo mới
  const handleOpenCreate = () => {
    setEditingItem(null);
    setError('');
    setFormData({
      ...emptyForm,
      pillarId: pillars[0]?.id || 0,
      pillarCode: pillars[0]?.pillarCode || '',
      purchaseDate: new Date().toISOString().split('T')[0], // Mặc định hôm nay
      lastMaintenanceDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  // Xử lý mở Modal Sửa (Áp dụng Fetch Detail)
  const handleOpenEdit = async (item: Equipment) => {
    setError('');
    setEditingItem(item);
    setFormData(emptyForm);
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      // 💥 Kéo dữ liệu mới nhất của thiết bị từ server
      const freshData = await equipmentApi.getEquipment(item.id);
      setEditingItem(freshData);
      
      setFormData({
        equipmentName: freshData.equipmentName || '',
        serialNumber: freshData.serialNumber || '',
        description: freshData.description || '',
        status: freshData.status || 'AVAILABLE',
        pillarId: freshData.pillarId || 0,
        pillarCode: freshData.pillarCode || '',
        // Cắt chuỗi ISO để hiển thị vừa vặn trong input type="date" (YYYY-MM-DD)
        purchaseDate: freshData.purchaseDate ? freshData.purchaseDate.split('T')[0] : '',
        lastMaintenanceDate: freshData.lastMaintenanceDate ? freshData.lastMaintenanceDate.split('T')[0] : '',
        imageUrl: freshData.imageUrl || ''
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

  // Xử lý thay đổi chọn Trụ -> Cập nhật luôn pillarCode
  const handlePillarChange = (pillarId: number) => {
    const selectedPillar = pillars.find(p => p.id === pillarId);
    setFormData(prev => ({
      ...prev,
      pillarId: pillarId,
      pillarCode: selectedPillar?.pillarCode || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentName?.trim() || !formData.serialNumber?.trim()) {
      alert('Vui lòng nhập Tên thiết bị và Số Serial.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Chuẩn hóa payload gởi lên Backend
      const payload: Partial<Equipment> = {
        equipmentName: formData.equipmentName,
        serialNumber: formData.serialNumber,
        description: formData.description,
        status: formData.status,
        pillarId: Number(formData.pillarId),
        pillarCode: formData.pillarCode,
        // Chuyển đổi sang chuẩn ISO string nếu có chọn ngày
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
        lastMaintenanceDate: formData.lastMaintenanceDate ? new Date(formData.lastMaintenanceDate).toISOString() : undefined,
        imageUrl: formData.imageUrl
      };

      if (editingItem) {
        await equipmentApi.updateEquipment(editingItem.id, payload);
      } else {
        await equipmentApi.createEquipment(payload);
      }

      alert(editingItem ? 'Cập nhật thành công!' : 'Thêm thiết bị thành công!');
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Lỗi lưu thiết bị:', err);
      alert('Thao tác thất bại. Vui lòng kiểm tra lại.');
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
      alert('Xóa thất bại. Thiết bị có thể đang ràng buộc với dữ liệu khác.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Logic lọc dữ liệu tổng hợp
  const filteredEquipments = equipments.filter(eq => {
    const matchSearch = eq.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
                        eq.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? eq.status === statusFilter : true;
    const matchPillar = pillarFilter ? eq.pillarId?.toString() === pillarFilter : true;
    return matchSearch && matchStatus && matchPillar;
  });

  const statusConfig: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Hoạt động', cls: 'bg-green-100 text-green-700' },
    MAINTENANCE: { label: 'Bảo trì', cls: 'bg-yellow-100 text-yellow-700' },
    IN_USE: { label: 'Đang sử dụng', cls: 'bg-gray-100 text-gray-600' },
    BROKEN: { label: 'Hỏng hóc', cls: 'bg-red-100 text-red-700' },
  };

  // Chuẩn bị danh sách options cho Pillar Filter
  const pillarOptions: Option[] = [
    { value: '', label: 'Tất cả trụ vườn' },
    ...pillars.map(p => ({
      value: p.id,
      label: p.pillarCode || `Trụ #${p.id}`
    }))
  ];

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Thiết bị IoT">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header & Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Bar */}
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm tên, số serial..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-all outline-none" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>

            {/* 👉 Status Filter (Được thay bằng CustomDropdown bo tròn rounded-xl tuyệt đẹp) */}
            <CustomDropdown
              icon={<Filter className="w-4 h-4 text-green-600 shrink-0" />}
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={statusOptions}
            />

            {/* 👉 Pillar Filter (Được thay bằng CustomDropdown bo tròn rounded-xl tuyệt đẹp) */}
            <CustomDropdown
              icon={<Columns3 className="w-4 h-4 text-green-600 shrink-0" />}
              value={pillarFilter}
              onChange={(val) => setPillarFilter(String(val))}
              options={pillarOptions}
            />
          </div>

          {/* Add Button */}
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
                <th className="p-4 font-semibold text-gray-600">Vị trí (Trụ)</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600">Ngày bảo trì cuối</th>
                <th className="p-4 font-semibold text-gray-600">Mô tả</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải danh sách thiết bị...</td></tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Cpu className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy thiết bị IoT nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredEquipments.map(eq => {
                  const st = statusConfig[eq.status] || statusConfig.INACTIVE;
                  return (
                    <tr key={eq.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{eq.equipmentName}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">SN: {eq.serialNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {eq.pillarCode || (eq.pillarId ? `Trụ #${eq.pillarId}` : <span className="text-gray-400 italic">Chưa gán</span>)}
                      </td>
                      <td className="p-4">
                        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', st.cls)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {eq.lastMaintenanceDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(eq.lastMaintenanceDate).toLocaleDateString('vi-VN')}
                          </div>
                        ) : <span className="text-gray-400 italic">Chưa có</span>}
                      </td>
                      <td className="p-4 text-gray-500 max-w-[200px] truncate" title={eq.description}>
                        {eq.description || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(eq)} 
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(eq)} 
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Delete Confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Xóa thiết bị IoT?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Bạn có chắc muốn xóa <span className="font-semibold text-gray-900">"{confirmDelete.equipmentName}"</span> (SN: {confirmDelete.serialNumber})? Hành động này không thể hoàn tác.
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

        {/* Modal Add / Edit Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900">
                {editingItem ? 'Cập nhật thiết bị IoT' : 'Thêm thiết bị IoT mới'}
              </h2>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <p className="text-sm">Đang tải thông tin thiết bị từ máy chủ...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Tên thiết bị <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition" 
                        value={formData.equipmentName}
                        onChange={e => setFormData({...formData, equipmentName: e.target.value})}
                        placeholder="VD: Cảm biến độ ẩm đất"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Số Serial (SN) <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-mono" 
                        value={formData.serialNumber}
                        onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                        placeholder="VD: SN-2024-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Gắn vào Trụ vườn</label>
                      <select
                        value={formData.pillarId}
                        onChange={e => handlePillarChange(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                      >
                        <option value={0}>-- Trong kho / Chưa gán --</option>
                        {pillars.map(p => (
                          <option key={p.id} value={p.id}>{p.pillarCode || `Trụ #${p.id}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition">
                        <option value="AVAILABLE">Hoạt động (Available)</option>
                        <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
                        <option value="IN_USE">Đang sử dụng (In Use)</option>
                        <option value="BROKEN">Hỏng hóc (Broken)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Ngày mua</label>
                      <input 
                        type="date"
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition" 
                        value={formData.purchaseDate}
                        onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Bảo trì lần cuối</label>
                      <input 
                        type="date"
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition" 
                        value={formData.lastMaintenanceDate}
                        onChange={e => setFormData({...formData, lastMaintenanceDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">URL Hình ảnh (tùy chọn)</label>
                    <input 
                      type="url"
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition" 
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://example.com/sensor.jpg"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Mô tả thiết bị</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition" 
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Ghi chú về thông số kỹ thuật, vị trí lắp đặt cụ thể..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">
                      Hủy
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition shadow-sm shadow-green-600/20 disabled:opacity-50">
                      {isSubmitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm thiết bị'}
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