import { useState, useEffect, useRef } from 'react';
import { treeApi, Tree } from '../../api/treeApi';
import { 
  Trees, Plus, Edit2, Trash2, X, Search, Filter, 
  Loader2, Clock, ChevronDown, Sparkles,
  Droplets, Sun, Beaker, Upload, Image as ImageIcon,
  AlertCircle, Info
} from 'lucide-react';

import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { Toast, ToastData } from '../../components/common/Toast';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';
// 👉 Import thêm hàm deleteTreeImage
import { uploadTreeImage, deleteTreeImage } from '../../utils/firebaseUpload';

export interface Option {
  value: string | boolean;
  label: string;
}

// 👉 Component CustomDropdown bo tròn rounded-xl đẹp mắt
function CustomDropdown({ icon, value, onChange, options, placeholder = 'Chọn', className }: { icon: any; value: any; onChange: any; options: Option[]; placeholder?: string; className?: string }) {
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
  harvestDays: 35,
  minRentalDays: 30,
  price: 25000,
  priceSmall: 25000,
  priceMedium: 37500,
  priceLarge: 50000,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Toast thông báo
  const [toast, setToast] = useState<ToastData | null>(null);
  const showToast = (type: ToastData['type'], title: string, detail?: string) => setToast({ type, title, detail });

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
      showToast('warning', 'Định dạng ảnh không hợp lệ', 'Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Ảnh quá lớn', 'Dung lượng ảnh tối đa là 5MB');
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
      showToast('error', 'Tải ảnh thất bại', 'Không thể tải ảnh lên Firebase. Vui lòng thử lại!');
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

  const handleHarvestDaysChange = (days: number) => {
    setFormData(prev => {
      const newDays = days;
      const currentMin = prev.minRentalDays;
      return {
        ...prev,
        harvestDays: newDays,
        // Tự động nâng số ngày thuê tối thiểu bằng số ngày thu hoạch nếu chưa có hoặc đang nhỏ hơn
        minRentalDays: (!currentMin || currentMin < newDays) ? newDays : currentMin,
      };
    });
  };

  const handlePriceSmallChange = (val: number) => {
    const pSmall = val;
    setFormData(prev => ({
      ...prev,
      price: pSmall,
      priceSmall: pSmall,
      // Tự động gợi ý điền giá Trụ Vừa (x1.5) và Trụ Lớn (x2.0)
      priceMedium: Math.round(pSmall * 1.5),
      priceLarge: Math.round(pSmall * 2.0),
    }));
  };

  const handleAutoCalculatePrices = () => {
    const base = Number(formData.priceSmall || formData.price || 0);
    setFormData(prev => ({
      ...prev,
      price: base,
      priceSmall: base,
      priceMedium: Math.round(base * 1.5),
      priceLarge: Math.round(base * 2.0),
    }));
    showToast('success', 'Đã tính lại giá theo tỷ lệ chuẩn', 'Trụ Nhỏ: 1.0x | Trụ Vừa: 1.5x | Trụ Lớn: 2.0x');
  };

  // Chặn phím nhập số âm (-), số thập phân (., ,), ký tự e/E trên các ô chỉ cho phép số nguyên (như ngày, giá tiền)
  const blockDecimalAndNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  // Chặn phím nhập số âm (-) trên các ô cho phép số thập phân (như độ pH, độ ẩm, ánh sáng)
  const blockNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  // Các cờ kiểm tra lỗi thời gian thực (Real-time Validation Flags)
  const isRentalDaysInvalid = formData.harvestDays != null && formData.minRentalDays != null && formData.minRentalDays < formData.harvestDays;
  const isMoistureInvalid = formData.soilMoistureMin != null && formData.soilMoistureMax != null && formData.soilMoistureMax <= formData.soilMoistureMin;
  const isLightInvalid = formData.lightMin != null && formData.lightMax != null && formData.lightMax <= formData.lightMin;
  const isPhInvalid = formData.phMin != null && formData.phMax != null && formData.phMax <= formData.phMin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.treeName?.trim()) {
      showToast('warning', 'Thiếu thông tin bắt buộc', 'Vui lòng nhập Tên giống cây trồng.');
      return;
    }
    if (!formData.harvestDays || formData.harvestDays <= 0) {
      showToast('warning', 'Thời gian thu hoạch không hợp lệ', 'Thời gian thu hoạch phải là số nguyên dương lớn hơn 0 ngày.');
      return;
    }
    if (!Number.isInteger(Number(formData.harvestDays))) {
      showToast('warning', 'Định dạng ngày không hợp lệ', 'Thời gian thu hoạch phải là số nguyên ngày (không được nhập số lẻ/thập phân).');
      return;
    }
    if (!formData.minRentalDays || formData.minRentalDays < formData.harvestDays) {
      showToast(
        'warning',
        'Thời gian thuê chưa hợp lý',
        `Số ngày thuê tối thiểu (${formData.minRentalDays || 0} ngày) cần ít nhất bằng thời gian thu hoạch (${formData.harvestDays} ngày) để cây đủ chu kỳ sinh trưởng.`
      );
      return;
    }
    if (!Number.isInteger(Number(formData.minRentalDays))) {
      showToast('warning', 'Định dạng ngày không hợp lệ', 'Số ngày thuê tối thiểu phải là số nguyên ngày (không được nhập số lẻ/thập phân).');
      return;
    }

    if (
      (formData.priceSmall != null && formData.priceSmall < 0) ||
      (formData.priceMedium != null && formData.priceMedium < 0) ||
      (formData.priceLarge != null && formData.priceLarge < 0)
    ) {
      showToast('warning', 'Định giá không hợp lệ', 'Đơn giá phôi giống của từng loại trụ không được là số âm.');
      return;
    }
    if (
      (formData.soilMoistureMin != null && (formData.soilMoistureMin < 0 || formData.soilMoistureMin > 100)) ||
      (formData.soilMoistureMax != null && (formData.soilMoistureMax < 0 || formData.soilMoistureMax > 100))
    ) {
      showToast('warning', 'Chỉ số độ ẩm ngoài giới hạn', 'Độ ẩm đất chỉ được thiết lập trong phạm vi chuẩn từ 0% đến 100%.');
      return;
    }
    if (isMoistureInvalid) {
      showToast(
        'warning',
        'Định mức độ ẩm đất chưa chuẩn xác',
        `Ngưỡng độ ẩm tối đa (${formData.soilMoistureMax}%) phải cao hơn ngưỡng tối thiểu (${formData.soilMoistureMin}%).`
      );
      return;
    }
    if (
      (formData.lightMin != null && (formData.lightMin < 0 || formData.lightMin > 24)) ||
      (formData.lightMax != null && (formData.lightMax < 0 || formData.lightMax > 24))
    ) {
      showToast('warning', 'Thời gian chiếu sáng ngoài giới hạn', 'Thời gian chiếu sáng hàng ngày chỉ được thiết lập từ 0 đến 24 giờ.');
      return;
    }
    if (isLightInvalid) {
      showToast(
        'warning',
        'Thời gian chiếu sáng chưa chuẩn xác',
        `Ngưỡng chiếu sáng tối đa (${formData.lightMax} giờ) phải lớn hơn ngưỡng tối thiểu (${formData.lightMin} giờ).`
      );
      return;
    }
    if (
      (formData.phMin != null && (formData.phMin < 0 || formData.phMin > 14)) ||
      (formData.phMax != null && (formData.phMax < 0 || formData.phMax > 14))
    ) {
      showToast('warning', 'Chỉ số pH ngoài giới hạn', 'Độ pH chỉ được thiết lập trong thang đo hóa học chuẩn từ 0 đến 14.');
      return;
    }
    if (isPhInvalid) {
      showToast(
        'warning',
        'Chỉ số độ pH chưa chuẩn xác',
        `Ngưỡng pH tối đa (${formData.phMax}) phải cao hơn ngưỡng pH tối thiểu (${formData.phMin}).`
      );
      return;
    }



    setIsSubmitting(true);
    try {
      if (editingItem) {
        await treeApi.updateTree(editingItem.id, formData);
      } else {
        await treeApi.createTree(formData);
      }
      showToast('success', editingItem ? 'Cập nhật cây trồng thành công!' : 'Thêm giống cây mới thành công!');
      // Khi bấm Lưu thành công thì CHỈ ĐÓNG MODAL (không xóa ảnh vì ảnh đã trở thành ảnh chính thức)
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error('Lỗi lưu cây trồng:', err);
      const detailMsg = err?.response?.data?.message || 'Vui lòng kiểm tra lại thông số.';
      showToast('error', 'Thao tác thất bại', detailMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await treeApi.forceDeleteTree(confirmDelete.id);
      setConfirmDelete(null);
      showToast('success', 'Đã xóa giống cây trồng');
      fetchData();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        showToast('error', 'Không có quyền xóa', 'Vui lòng liên hệ Quản lý kinh doanh.');
      } else {
        const detail = err?.response?.data?.message || err?.message || 'Không rõ nguyên nhân.';
        showToast('error', 'Xóa thất bại', detail);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTrees = trees
    .filter(t => {
      const matchSearch = t.treeName?.toLowerCase().includes(search.toLowerCase()) ||
                          t.scientificName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '' ? true : String(t.isActive) === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredTrees.length / pageSize) || 1;
  const paginatedTrees = filteredTrees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Danh mục Cây trồng">
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
                placeholder="Tìm tên cây, tên khoa học..."
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
                <th className="p-4 font-semibold text-gray-600">Cây trồng</th>
                <th className="p-4 font-semibold text-gray-600">Bảng giá theo trụ</th>
                <th className="p-4 font-semibold text-gray-600">Thu hoạch</th>
                <th className="p-4 font-semibold text-gray-600">Định mức sinh thái (IoT)</th>
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
                paginatedTrees.map(tree => (
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
                        <div className="font-semibold text-gray-900">{tree.treeName}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs min-w-[170px]">
                        <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                          <span>🟢 Nhỏ (24h):</span>
                          <span className="font-bold">{Number(tree.priceSmall || tree.price || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/60 font-medium">
                          <span>🔵 Vừa (36h):</span>
                          <span className="font-bold">{Number(tree.priceMedium || ((tree.price || 0) * 1.5)).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60 font-medium">
                          <span>🟣 Lớn (48h):</span>
                          <span className="font-bold">{Number(tree.priceLarge || ((tree.price || 0) * 2.0)).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
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

          {filteredTrees.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTrees.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="giống cây"
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
                <form onSubmit={handleSubmit} noValidate className="space-y-6 text-sm">
                  
                  {/* PHẦN 1: THÔNG TIN & KINH DOANH */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-3">
                      1. Thông tin định danh & Kinh doanh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-medium text-gray-700 mb-1">Tên cây trồng <span className="text-red-500">*</span></label>
                        <input
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                          value={formData.treeName || ''}
                          onChange={e => setFormData({...formData, treeName: e.target.value})}
                          placeholder="VD: Cây Tràm, Xà lách xoăn, Cải Kale..."
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Thời gian thu hoạch (Ngày) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step={1}
                          onKeyDown={blockDecimalAndNegative}
                          className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
                          value={formData.harvestDays ?? ''}
                          onChange={e => handleHarvestDaysChange(Math.floor(Math.max(1, Number(e.target.value) || 0)))}
                          placeholder="VD: 35"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          Chu kỳ sinh trưởng từ khi gieo trồng đến lúc thu hoạch.
                        </p>
                      </div>
                      <div>
                        <label className="block font-medium text-gray-700 mb-1">Số ngày thuê tối thiểu (Ngày) <span className="text-red-500">*</span></label>
                        <input
                          type="number" 
                          step={1}
                          onKeyDown={blockDecimalAndNegative}
                          className={clsx(
                            "w-full border rounded-xl p-2.5 outline-none transition-all",
                            isRentalDaysInvalid 
                              ? "border-rose-500 ring-2 ring-rose-500/10 text-rose-700 bg-rose-50/30 font-semibold" 
                              : "border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          )}
                          value={formData.minRentalDays ?? ''}
                          onChange={e => setFormData({...formData, minRentalDays: Math.floor(Math.max(1, Number(e.target.value) || 0))})}
                          placeholder={`≥ ${formData.harvestDays || 30}`}
                        />
                        {isRentalDaysInvalid ? (
                          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg p-2 mt-1.5 flex items-start gap-1.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>Số ngày thuê tối thiểu ({formData.minRentalDays} ngày) phải lớn hơn hoặc bằng chu kỳ thu hoạch ({formData.harvestDays} ngày).</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            Đảm bảo thời gian thuê đủ để cây hoàn thành chu kỳ thu hoạch.
                          </p>
                        )}
                      </div>
                    </div>


                    {/* KHU VỰC BẢNG GIÁ PHÔI GIỐNG THEO TRỤ */}
                    <div className="mt-4 p-4 rounded-xl bg-gray-50/80 border border-gray-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            Định giá phôi giống theo từng loại trụ (VNĐ) <span className="text-red-500">*</span>
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Quản lý có thể nhập độc lập từng mức giá hoặc dùng nút gợi ý tỷ lệ chuẩn (1.0x - 1.5x - 2.0x).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoCalculatePrices}
                          className="text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 shadow-xs whitespace-nowrap self-start sm:self-auto"
                          title="Tự động tính giá Trụ Vừa (x1.5) và Trụ Lớn (x2.0) từ giá Trụ Nhỏ"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Tự động tính 1.5x / 2.0x
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Trụ Nhỏ 24 hốc */}
                        <div className="bg-white p-3 rounded-xl border-2 border-emerald-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1">
                              🟢 Trụ Nhỏ (24 hốc)
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">1.0x</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              onKeyDown={blockDecimalAndNegative}
                              className="w-full border border-emerald-300 rounded-lg p-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none pr-8"
                              value={formData.priceSmall ?? formData.price ?? ''}
                              onChange={e => handlePriceSmallChange(Math.floor(Math.max(0, Number(e.target.value) || 0)))}
                              placeholder="VD: 25000"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">đ</span>
                          </div>
                        </div>

                        {/* Trụ Vừa 36 hốc */}
                        <div className="bg-white p-3 rounded-xl border-2 border-blue-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-blue-800 text-xs flex items-center gap-1">
                              🔵 Trụ Vừa (36 hốc)
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">1.5x</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              onKeyDown={blockDecimalAndNegative}
                              className="w-full border border-blue-300 rounded-lg p-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none pr-8"
                              value={formData.priceMedium ?? ''}
                              onChange={e => setFormData({ ...formData, priceMedium: Math.floor(Math.max(0, Number(e.target.value) || 0)) })}
                              placeholder="VD: 37500"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">đ</span>
                          </div>
                        </div>

                        {/* Trụ Lớn 48 hốc */}
                        <div className="bg-white p-3 rounded-xl border-2 border-purple-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-purple-800 text-xs flex items-center gap-1">
                              🟣 Trụ Lớn (48 hốc)
                            </span>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">2.0x</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              onKeyDown={blockDecimalAndNegative}
                              className="w-full border border-purple-300 rounded-lg p-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none pr-8"
                              value={formData.priceLarge ?? ''}
                              onChange={e => setFormData({ ...formData, priceLarge: Math.floor(Math.max(0, Number(e.target.value) || 0)) })}
                              placeholder="VD: 50000"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">đ</span>
                          </div>
                        </div>
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
                            Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB. Ảnh sẽ được tự động lưu trữ trên Firebase Cloud Storage.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 2: THÔNG SỐ SINH THÁI - IOT */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        2. Định mức sinh thái & Ngưỡng an toàn IoT
                      </h3>
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        Hệ thống IoT tự động cảnh báo khi vượt ngưỡng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Độ ẩm đất */}
                      <div className={clsx(
                        "p-3.5 rounded-xl border transition-all duration-200",
                        isMoistureInvalid ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/10" : "bg-gray-50/80 border-gray-200/80 hover:border-blue-300/60"
                      )}>
                        <span className="font-semibold text-blue-700 block mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs"><Droplets className="w-4 h-4 text-blue-500"/> Độ ẩm đất (%)</span>
                          <span className="text-[10px] bg-blue-100/70 text-blue-700 px-1.5 py-0.5 rounded font-bold">0 - 100%</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={100} placeholder="Min" 
                              onKeyDown={blockNegative}
                              className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition shadow-2xs" 
                              value={formData.soilMoistureMin ?? ''} 
                              onChange={e => setFormData({...formData, soilMoistureMin: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối thiểu</span>
                          </div>
                          <span className="text-gray-300 font-bold mb-3">-</span>
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={100} placeholder="Max" 
                              onKeyDown={blockNegative}
                              className={clsx(
                                "w-full p-2 border rounded-lg text-center text-sm font-semibold outline-none bg-white transition shadow-2xs",
                                isMoistureInvalid ? "border-rose-500 text-rose-700 font-bold ring-1 ring-rose-500/20" : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              )}
                              value={formData.soilMoistureMax ?? ''} 
                              onChange={e => setFormData({...formData, soilMoistureMax: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối đa</span>
                          </div>
                        </div>
                        {isMoistureInvalid && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg p-2 mt-2 flex items-start gap-1.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>Ngưỡng tối đa phải lớn hơn ngưỡng tối thiểu ({formData.soilMoistureMin}%).</span>
                          </div>
                        )}
                      </div>

                      {/* Ánh sáng */}
                      <div className={clsx(
                        "p-3.5 rounded-xl border transition-all duration-200",
                        isLightInvalid ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/10" : "bg-gray-50/80 border-gray-200/80 hover:border-amber-300/60"
                      )}>
                        <span className="font-semibold text-amber-700 block mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs"><Sun className="w-4 h-4 text-amber-500"/> Ánh sáng (Giờ)</span>
                          <span className="text-[10px] bg-amber-100/70 text-amber-700 px-1.5 py-0.5 rounded font-bold">0 - 24h</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={24} placeholder="Min" 
                              onKeyDown={blockNegative}
                              className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white transition shadow-2xs" 
                              value={formData.lightMin ?? ''} 
                              onChange={e => setFormData({...formData, lightMin: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối thiểu</span>
                          </div>
                          <span className="text-gray-300 font-bold mb-3">-</span>
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={24} placeholder="Max" 
                              onKeyDown={blockNegative}
                              className={clsx(
                                "w-full p-2 border rounded-lg text-center text-sm font-semibold outline-none bg-white transition shadow-2xs",
                                isLightInvalid ? "border-rose-500 text-rose-700 font-bold ring-1 ring-rose-500/20" : "border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                              )}
                              value={formData.lightMax ?? ''} 
                              onChange={e => setFormData({...formData, lightMax: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối đa</span>
                          </div>
                        </div>
                        {isLightInvalid && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg p-2 mt-2 flex items-start gap-1.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>Ngưỡng chiếu sáng tối đa phải lớn hơn {formData.lightMin} giờ.</span>
                          </div>
                        )}
                      </div>

                      {/* Độ pH */}
                      <div className={clsx(
                        "p-3.5 rounded-xl border transition-all duration-200",
                        isPhInvalid ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/10" : "bg-gray-50/80 border-gray-200/80 hover:border-purple-300/60"
                      )}>
                        <span className="font-semibold text-purple-700 block mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs"><Beaker className="w-4 h-4 text-purple-500"/> Độ pH đất</span>
                          <span className="text-[10px] bg-purple-100/70 text-purple-700 px-1.5 py-0.5 rounded font-bold">0 - 14 pH</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={14} placeholder="Min" 
                              onKeyDown={blockNegative}
                              className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm font-semibold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white transition shadow-2xs" 
                              value={formData.phMin ?? ''} 
                              onChange={e => setFormData({...formData, phMin: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối thiểu</span>
                          </div>
                          <span className="text-gray-300 font-bold mb-3">-</span>
                          <div className="flex-1">
                            <input 
                              type="number" step="any" min={0} max={14} placeholder="Max" 
                              onKeyDown={blockNegative}
                              className={clsx(
                                "w-full p-2 border rounded-lg text-center text-sm font-semibold outline-none bg-white transition shadow-2xs",
                                isPhInvalid ? "border-rose-500 text-rose-700 font-bold ring-1 ring-rose-500/20" : "border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              )}
                              value={formData.phMax ?? ''} 
                              onChange={e => setFormData({...formData, phMax: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))})} 
                            />
                            <span className="text-[10px] text-gray-400 block text-center mt-1">Tối đa</span>
                          </div>
                        </div>
                        {isPhInvalid && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg p-2 mt-2 flex items-start gap-1.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>Độ pH tối đa phải lớn hơn độ pH tối thiểu ({formData.phMin}).</span>
                          </div>
                        )}
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