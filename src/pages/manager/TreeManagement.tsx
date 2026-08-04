import React, { useState, useEffect, useRef } from 'react';
import { treeApi, Tree } from '../../api/treeApi';
import { 
  Trees, Plus, Edit2, Trash2, X, Search, Filter, 
  Loader2, DollarSign, Clock, ShieldAlert, ChevronDown, 
  Droplets, Sun, Beaker, Upload, Image as ImageIcon 
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';
// 👉 Import thêm hàm deleteTreeImage
import { uploadTreeImage, deleteTreeImage } from '../../utils/firebaseUpload';

interface Option {
  value: string | boolean;
  label: string;
}

// 👉 Component CustomDropdown bo tròn rounded-xl đẹp mắt
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

const emptyForm: Partial<Tree> = {
  treeName: '',
  scientificName: '',
  description: '',
  harvestDays: 90,
  minRentalDays: 30,
  price: 100000,
  imageUrl: '',
  soilMoistureMin: 30,
  soilMoistureMax: 70,
  lightMin: 6,
  lightMax: 10,
  phMin: 5.5,
  phMax: 7.0,
  compensationPercentage: 50,
  careInstructions: '',
  isActive: true,
};

export default function TreeManagement() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tree | null>(null);
  const [formData, setFormData] = useState<Partial<Tree>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [confirmDelete, setConfirmDelete] = useState<Tree | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State quản lý loading khi đang upload ảnh lên Firebase
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 💥 HÀM THÔNG MINH: Xóa ảnh tạm khỏi Firebase nếu ảnh đó KHÔNG phải ảnh gốc trong DB
  const removeTempImage = async (urlToRemove?: string | null) => {
    if (!urlToRemove) return;
    // Chỉ xóa trên Cloud Storage nếu ảnh này khác với ảnh ban đầu của cây đang chỉnh sửa
    if (urlToRemove !== editingItem?.imageUrl) {
      await deleteTreeImage(urlToRemove);
    }
  };

  // Hàm xử lý khi người dùng chọn file hình từ máy
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
      // 💥 1. Nếu trước đó đã lỡ tải lên 1 ảnh tạm khác rồi, xóa ngay ảnh đó khỏi Firebase cho sạch rác
      await removeTempImage(formData.imageUrl);

      // 2. Upload ảnh mới lên
      const firebaseUrl = await uploadTreeImage(file);
      setFormData(prev => ({ ...prev, imageUrl: firebaseUrl }));
    } catch (err) {
      console.error('Lỗi upload ảnh Firebase:', err);
      alert('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await treeApi.getTrees();
      setTrees(data || []);
    } catch (err) {
      setError('Không thể tải danh sách cây trồng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setError('');
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Tree) => {
    setError('');
    setEditingItem(item);
    setFormData(emptyForm);
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      const freshData = await treeApi.getTree(item.id);
      setEditingItem(freshData);
      setFormData(freshData);
    } catch (err) {
      setError('Không thể tải chi tiết cây trồng từ máy chủ.');
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // 💥 Xử lý khi bấm nút "Hủy" hoặc nút "X" tắt Modal -> Dọn rác nếu có upload ảnh tạm
  const handleCancelModal = async () => {
    await removeTempImage(formData.imageUrl);
    handleCloseModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.treeName?.trim() || !formData.scientificName?.trim()) {
      alert('Vui lòng nhập Tên cây và Tên khoa học.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await treeApi.updateTree(editingItem.id, formData);
      } else {
        await treeApi.createTree(formData);
      }
      alert(editingItem ? 'Cập nhật cây trồng thành công!' : 'Thêm giống cây mới thành công!');
      // Khi bấm Lưu thành công thì CHỈ ĐÓNG MODAL (không xóa ảnh vì ảnh đã trở thành ảnh chính thức)
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Lỗi lưu cây trồng:', err);
      alert('Thao tác thất bại. Vui lòng kiểm tra lại thông số.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await treeApi.deleteTree(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      alert('Xóa thất bại. Giống cây này có thể đang được khách hàng thuê hoặc canh tác.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTrees = trees.filter(t => {
    const matchSearch = t.treeName?.toLowerCase().includes(search.toLowerCase()) ||
                        t.scientificName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : String(t.isActive) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Danh mục Cây trồng">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[260px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên cây, tên khoa học..."
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
                { value: "true", label: "Đang kinh doanh" },
                { value: "false", label: "Ngưng kinh doanh" },
              ]}
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm shadow-green-600/20 transition whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm giống cây
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Cây trồng & Khoa học</th>
                <th className="p-4 font-semibold text-gray-600">Giá thuê / Thu hoạch</th>
                <th className="p-4 font-semibold text-gray-600">Định mức sinh thái (IoT)</th>
                <th className="p-4 font-semibold text-gray-600">Đền bù</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải danh mục cây trồng...</td></tr>
              ) : filteredTrees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Trees className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy giống cây trồng nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                filteredTrees.map(tree => (
                  <tr key={tree.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 overflow-hidden font-bold text-xs">
                          {tree.imageUrl ? (
                            <img src={tree.imageUrl} alt={tree.treeName} className="w-full h-full object-cover" />
                          ) : (
                            <Trees className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{tree.treeName}</div>
                          <div className="text-xs text-gray-400 italic mt-0.5">{tree.scientificName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-green-600 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {tree.price?.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        Thu hoạch: ~{tree.harvestDays} ngày (Thuê min {tree.minRentalDays} ngày)
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Ẩm: {tree.soilMoistureMin}% - {tree.soilMoistureMax}%</span>
                        <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> Sáng: {tree.lightMin} - {tree.lightMax} giờ</span>
                        <span className="flex items-center gap-1.5"><Beaker className="w-3.5 h-3.5 text-purple-500" /> pH: {tree.phMin} - {tree.phMax}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-semibold border border-amber-100/50">
                        <ShieldAlert className="w-3 h-3" />
                        {tree.compensationPercentage}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', tree.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {tree.isActive ? 'Đang kinh doanh' : 'Ngưng kinh doanh'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(tree)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                          title="Chỉnh sửa thông số"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(tree)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa giống cây"
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
              <h3 className="text-lg font-bold text-center mb-2">Xóa giống cây trồng?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Bạn có chắc muốn xóa giống cây <span className="font-semibold text-gray-900">"{confirmDelete.treeName}"</span> ({confirmDelete.scientificName})? Hành động này không thể hoàn tác.
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
                onClick={handleCancelModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900 flex items-center gap-2">
                <Trees className="w-6 h-6 text-green-600" />
                {editingItem ? 'Cập nhật thông số Cây trồng' : 'Thêm giống Cây trồng mới'}
              </h2>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <p className="text-sm">Đang tải thông số sinh thái mới nhất từ máy chủ...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                  
                  {/* PHẦN 1: THÔNG TIN & KINH DOANH */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-3">
                      1. Thông tin định danh & Kinh doanh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Tên cây trồng <span className="text-red-500">*</span></label>
                        <input
                          required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                          value={formData.treeName || ''}
                          onChange={e => setFormData({...formData, treeName: e.target.value})}
                          placeholder="VD: Cây Tràm"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Tên khoa học <span className="text-red-500">*</span></label>
                        <input
                          required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition italic"
                          value={formData.scientificName || ''}
                          onChange={e => setFormData({...formData, scientificName: e.target.value})}
                          placeholder="VD: Melaleuca cajuputi"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Giá thuê (VNĐ / kỳ) <span className="text-red-500">*</span></label>
                        <input
                          type="number" step={1000} min={0} required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-semibold text-green-600"
                          value={formData.price ?? ''}
                          onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Tỷ lệ đền bù thiệt hại (%) <span className="text-red-500">*</span></label>
                        <input
                          type="number" min={0} max={100} required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.compensationPercentage ?? ''}
                          onChange={e => setFormData({...formData, compensationPercentage: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Thời gian thu hoạch (Ngày)</label>
                        <input
                          type="number" min={1} required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.harvestDays ?? ''}
                          onChange={e => setFormData({...formData, harvestDays: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Số ngày thuê tối thiểu (Ngày)</label>
                        <input
                          type="number" min={1} required
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.minRentalDays ?? ''}
                          onChange={e => setFormData({...formData, minRentalDays: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    {/* KHU VỰC UPLOAD ẢNH FIREBASE */}
                    <div className="mt-4">
                      <label className="block font-medium text-gray-700 mb-1.5">Hình ảnh giống cây</label>
                      
                      <div className="flex items-center gap-4">
                        {/* Box Khung xem trước ảnh (Preview) */}
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                          {isUploadingImage ? (
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                          ) : formData.imageUrl ? (
                            <>
                              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              {/* 💥 NÚT XÓA ẢNH NHANH TRÊN FORM: Tự động xóa trên Firebase nếu là ảnh tạm */}
                              <button
                                type="button"
                                onClick={async () => {
                                  await removeTempImage(formData.imageUrl);
                                  setFormData({ ...formData, imageUrl: '' });
                                }}
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
                            <span>{isUploadingImage ? 'Đang tải lên Firebase...' : 'Chọn ảnh từ máy...'}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageChange} 
                              disabled={isUploadingImage}
                              className="hidden" 
                            />
                          </label>
                          <p className="text-xs text-gray-400 mt-1.5">
                            Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB. Ảnh sẽ được tự động lưu trữ trên Firebase Cloud Storage.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 2: THÔNG SỐ SINH THÁI - IOT */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
                      2. Định mức sinh thái cảnh báo IoT (Min - Max)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                        <span className="font-semibold text-blue-600 block mb-2 flex items-center gap-1"><Droplets className="w-4 h-4"/> Độ ẩm đất (%)</span>
                        <div className="flex items-center gap-2">
                          <input type="number" step={0.1} placeholder="Min" className="w-full p-1.5 border rounded-lg text-center" value={formData.soilMoistureMin ?? ''} onChange={e => setFormData({...formData, soilMoistureMin: Number(e.target.value)})} />
                          <span>-</span>
                          <input type="number" step={0.1} placeholder="Max" className="w-full p-1.5 border rounded-lg text-center" value={formData.soilMoistureMax ?? ''} onChange={e => setFormData({...formData, soilMoistureMax: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                        <span className="font-semibold text-amber-600 block mb-2 flex items-center gap-1"><Sun className="w-4 h-4"/> Ánh sáng (Giờ)</span>
                        <div className="flex items-center gap-2">
                          <input type="number" step={0.1} placeholder="Min" className="w-full p-1.5 border rounded-lg text-center" value={formData.lightMin ?? ''} onChange={e => setFormData({...formData, lightMin: Number(e.target.value)})} />
                          <span>-</span>
                          <input type="number" step={0.1} placeholder="Max" className="w-full p-1.5 border rounded-lg text-center" value={formData.lightMax ?? ''} onChange={e => setFormData({...formData, lightMax: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                        <span className="font-semibold text-purple-600 block mb-2 flex items-center gap-1"><Beaker className="w-4 h-4"/> Độ pH đất</span>
                        <div className="flex items-center gap-2">
                          <input type="number" step={0.1} placeholder="Min" className="w-full p-1.5 border rounded-lg text-center" value={formData.phMin ?? ''} onChange={e => setFormData({...formData, phMin: Number(e.target.value)})} />
                          <span>-</span>
                          <input type="number" step={0.1} placeholder="Max" className="w-full p-1.5 border rounded-lg text-center" value={formData.phMax ?? ''} onChange={e => setFormData({...formData, phMax: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 3: HƯỚNG DẪN & TRẠNG THÁI */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg mb-3">
                      3. Hướng dẫn canh tác & Trạng thái
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Mô tả giới thiệu cây</label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.description || ''}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          placeholder="Cây tràm chịu hạn tốt, phù hợp trồng ở vùng đất khô..."
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Hướng dẫn chăm sóc (cho Gardener)</label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                          value={formData.careInstructions || ''}
                          onChange={e => setFormData({...formData, careInstructions: e.target.value})}
                          placeholder="Tưới nước 2 lần/tuần vào sáng sớm, bón phân mỗi tháng..."
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox" id="isActive"
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          checked={formData.isActive ?? true}
                          onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        />
                        <label htmlFor="isActive" className="font-medium text-gray-800 cursor-pointer select-none">
                          Mở bán / Cho phép thuê giống cây này
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {/* 💥 NÚT HỦY: Sử dụng handleCancelModal để dọn rác ảnh tạm */}
                    <button type="button" onClick={handleCancelModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || isUploadingImage} 
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition shadow-sm shadow-green-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu...' : isUploadingImage ? 'Chờ tải ảnh...' : editingItem ? 'Cập nhật giống cây' : 'Thêm cây mới'}
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