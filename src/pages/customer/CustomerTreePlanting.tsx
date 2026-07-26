import React, { useState, useEffect, useRef } from 'react';
import { treePlantingApi, TreePlantingRequest, CreateTreePlantingPayload } from '../../api/TreePlantingApi';
import { 
  Sprout, Plus, Search, Filter, Clock, CheckCircle2, 
  XCircle, Calendar, FileText, MapPin, ChevronDown, 
  X, Eye, Loader2, AlertCircle, Sparkles 
} from 'lucide-react';
import clsx from 'clsx';

// Component Dropdown bo tròn
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

const initialForm: CreateTreePlantingPayload = {
  rentalId: '' as any,
  newTreeId: '' as any,
  reason: '',
  notes: '',
};

export default function CustomerTreePlanting() {
  const [requests, setRequests] = useState<TreePlantingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Lọc & Tìm kiếm
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Tạo yêu cầu mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTreePlantingPayload>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Xem chi tiết & Phản hồi từ Admin
  const [selectedDetail, setSelectedDetail] = useState<TreePlantingRequest | null>(null);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const data = await treePlantingApi.getMyRequests();
      setRequests(data || []);
    } catch (err) {
      setError('Không thể tải lịch sử yêu cầu trồng cây của bạn.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMyRequests(); }, []);

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setIsCreateModalOpen(true);
  };

  // Gửi Form tạo mới (POST /api/tree-planting)
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rentalId || !formData.newTreeId || !formData.reason.trim()) {
      alert('Vui lòng nhập đầy đủ Mã hợp đồng, Mã cây trồng và Lý do trồng.');
      return;
    }

    setIsSubmitting(true);
    try {
      await treePlantingApi.createRequest({
        rentalId: Number(formData.rentalId),
        newTreeId: Number(formData.newTreeId),
        reason: formData.reason,
        notes: formData.notes || '',
      });
      alert('🎉 Đã gửi yêu cầu trồng cây thành công! Hệ thống nhà vườn sẽ sớm kiểm tra và phản hồi.');
      setIsCreateModalOpen(false);
      fetchMyRequests();
    } catch (err) {
      console.error('Lỗi tạo yêu cầu:', err);
      alert('Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc danh sách hiển thị
  const filteredRequests = requests.filter(item => {
    const matchSearch = 
      item.slotNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.newTreeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.reason?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Thống kê nhanh
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200/60"><CheckCircle2 className="w-3.5 h-3.5" /> Đã chấp thuận</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200/60"><XCircle className="w-3.5 h-3.5" /> Bị từ chối</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200/60"><Clock className="w-3.5 h-3.5" /> Chờ xử lý</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      
      {/* Header Trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sprout className="w-7 h-7 text-green-600" />
            Yêu cầu Trồng & Thay thế Cây
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gửi yêu cầu trồng giống cây mới vào khu đất bạn đang thuê và theo dõi tiến độ phê duyệt từ nhà vườn.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-green-600/20 transition hover:-translate-y-0.5 active:translate-y-0 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Gửi yêu cầu trồng cây
        </button>
      </div>

      {/* Thẻ Thống Kê Nhanh (Stats Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 font-medium">Tổng yêu cầu</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-gray-500 font-medium">Chờ phản hồi</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-gray-500 font-medium">Đã chấp thuận</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500 font-medium">Chưa phù hợp</div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 text-sm border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

      {/* Bộ lọc và Tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative min-w-[280px] flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã khu đất, tên cây, lý do..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm outline-none transition" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <CustomDropdown
          icon={<Filter className="w-4 h-4 text-green-600 shrink-0" />}
          value={statusFilter}
          onChange={(val: any) => setStatusFilter(String(val))}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "PENDING", label: "Chờ nhà vườn phản hồi" },
            { value: "APPROVED", label: "Đã đồng ý trồng" },
            { value: "REJECTED", label: "Đã từ chối" },
          ]}
        />
      </div>

      {/* Danh sách Yêu cầu (Table / Card responsive) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="p-4 font-semibold">Vị trí khu đất (Slot)</th>
              <th className="p-4 font-semibold">Giống cây yêu cầu</th>
              <th className="p-4 font-semibold">Lý do trồng</th>
              <th className="p-4 font-semibold">Ngày gửi</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-right">Phản hồi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-600" />
                  <p>Đang tải lịch sử yêu cầu của bạn...</p>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-gray-400">
                  <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-600" />
                  <p className="text-base font-medium text-gray-600">Bạn chưa có yêu cầu trồng cây nào</p>
                  <p className="text-xs text-gray-400 mt-1">Bấm nút "Gửi yêu cầu trồng cây" ở góc trên để bắt đầu thêm mảng xanh nhé!</p>
                </td>
              </tr>
            ) : (
              filteredRequests.map(item => (
                <tr key={item.id} className="hover:bg-green-50/30 transition duration-150">
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{item.slotNumber || `Slot #${item.rentalId}`}</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 block">Hợp đồng ID: {item.rentalId}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-green-700 bg-green-50/80 border border-green-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.newTreeName || `Cây ID: ${item.newTreeId}`}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate font-medium">
                    {item.reason}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(item.requestedAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 ml-5">
                      {new Date(item.requestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedDetail(item)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-green-700 bg-gray-100/80 hover:bg-green-100/50 rounded-xl transition inline-flex items-center gap-1.5 border border-transparent hover:border-green-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chi tiết</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 💥 MODAL 1: TẠO YÊU CẦU TRỒNG CÂY MỚI (POST /api/tree-planting) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center font-bold">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gửi Yêu Cầu Trồng Cây</h2>
                <p className="text-xs text-gray-500">Điền thông tin vị trí đất và giống cây bạn muốn trồng mới</p>
              </div>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Mã Hợp Đồng / Vị Trí Đất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" required min={1}
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition font-semibold text-gray-800"
                    placeholder="VD: 3 (rentalId)"
                    value={formData.rentalId || ''}
                    onChange={e => setFormData({ ...formData, rentalId: Number(e.target.value) })}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Mã hợp đồng thuê ô đất của bạn</span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Mã Giống Cây Muốn Trồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" required min={1}
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition font-semibold text-green-600"
                    placeholder="VD: 3 (newTreeId)"
                    value={formData.newTreeId || ''}
                    onChange={e => setFormData({ ...formData, newTreeId: Number(e.target.value) })}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">ID của giống cây trong danh mục</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                  Lý Do Trồng / Thay Thế <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3} required
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800"
                  placeholder="VD: Cây hiện tại đã hết chu kỳ thu hoạch, tôi muốn trồng thêm giống cây Mai để chuẩn bị Tết..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                  Ghi Chú Cho Nhà Vườn <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800"
                  placeholder="VD: Nhờ kỹ thuật viên kiểm tra độ ẩm đất kỹ trước khi hạ thổ..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="bg-green-50/60 border border-green-100 p-3.5 rounded-2xl text-xs text-green-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p>
                  Yêu cầu của bạn sẽ được gửi tới kỹ thuật viên nhà vườn kiểm tra điều kiện thổ nhưỡng và quy hoạch vị trí trước khi chấp thuận.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-md shadow-green-600/20 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
                  <span>Gửi yêu cầu ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💥 MODAL 2: XEM CHI TIẾT & PHẢN HỒI TỪ QUẢN LÝ */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pr-8 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Chi tiết Yêu cầu #{selectedDetail.id}
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trạng thái:</span>
                  <div>{getStatusBadge(selectedDetail.status)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vị trí ô đất:</span>
                  <span className="font-bold text-gray-900">{selectedDetail.slotNumber} (Rental ID: {selectedDetail.rentalId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giống cây mong muốn:</span>
                  <span className="font-bold text-green-600">{selectedDetail.newTreeName} (ID: {selectedDetail.newTreeId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời gian gửi:</span>
                  <span className="text-gray-800 font-medium">{new Date(selectedDetail.requestedAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lý do & Ghi chú của bạn:</span>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-gray-800">
                  <p className="font-medium">"{selectedDetail.reason}"</p>
                  {selectedDetail.notes && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200/60">
                      <strong>Ghi chú:</strong> {selectedDetail.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* PHẦN QUAN TRỌNG: Lời nhắn phản hồi từ Admin/Nhà vườn */}
              <div className="pt-2">
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Phản hồi từ Nhà vườn:
                </span>
                
                {selectedDetail.status === 'PENDING' ? (
                  <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl text-amber-800 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Yêu cầu đang được bộ phận kỹ thuật xem xét. Chúng tôi sẽ phản hồi sớm nhất có thể.</span>
                  </div>
                ) : (
                  <div className={clsx(
                    "p-4 rounded-2xl border text-xs space-y-1.5",
                    selectedDetail.status === 'APPROVED' ? "bg-green-50/80 border-green-100 text-green-900" : "bg-red-50/80 border-red-100 text-red-900"
                  )}>
                    <p className="font-bold text-sm">
                      {selectedDetail.status === 'APPROVED' ? '🌱 Yêu cầu đã được phê duyệt!' : '⚠️ Yêu cầu chưa thể thực hiện'}
                    </p>
                    <p className="font-medium text-gray-700 bg-white/80 p-2.5 rounded-xl border border-gray-200/40">
                      "{selectedDetail.notes || (selectedDetail.status === 'APPROVED' ? 'Nhà vườn sẽ sớm tiến hành chuẩn bị cây giống và trồng theo lịch.' : 'Vị trí hoặc giống cây hiện tại chưa đáp ứng điều kiện quy hoạch.')}"
                    </p>
                    {selectedDetail.processedByName && (
                      <p className="text-[11px] text-gray-500 text-right pt-1">
                        Xử lý bởi: <strong>{selectedDetail.processedByName}</strong> lúc {new Date(selectedDetail.processedAt || '').toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}