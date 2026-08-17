import { useState, useEffect, useRef } from 'react';
import { treePlantingApi, TreePlantingRequest } from '../../api/TreePlantingApi';
import { managerApi } from '../../api/managerApi';
import {
  Sprout, Search, Filter, Clock, CheckCircle2,
  XCircle, User, MapPin, Calendar, FileText,
  ChevronDown, X, Eye, Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

// 👉 Custom Dropdown bo tròn đẹp mắt
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

export default function TreePlantingManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TreePlantingRequest[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // Chỉ manager/admin mới cần chọn cơ sở (location_manager chỉ có đúng 1 cơ sở, backend đã tự lọc sẵn)
  const canFilterByLocation = (user?.role === 'manager' || user?.role === 'admin') && locations.length > 0;

  // Modal Xử lý / Xem chi tiết
  const [selectedItem, setSelectedItem] = useState<TreePlantingRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processNotes, setProcessNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await treePlantingApi.getAllRequests();
      setRequests(data || []);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu trồng cây.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Tải danh sách cơ sở cho manager/admin để lọc yêu cầu theo cơ sở
  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      managerApi.getLocations().then((res: any) => setLocations(res || [])).catch((err: any) => {
        console.error('Không thể tải danh sách cơ sở:', err);
      });
    }
  }, [user]);

  const handleOpenDetail = (item: TreePlantingRequest) => {
    setSelectedItem(item);
    setProcessNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Cập nhật trạng thái Phê duyệt / Từ chối
  const handleProcessRequest = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      if (newStatus === 'APPROVED') {
        await treePlantingApi.approveRequest(selectedItem.id);
      } else {
        await treePlantingApi.rejectRequest(selectedItem.id, processNotes);
      }
      alert(`Đã ${newStatus === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} yêu cầu thành công!`);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Xử lý thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(item => {
    const matchSearch =
      item.slotNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.newTreeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.requestedByName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : item.status === statusFilter;
    const matchLocation = selectedLocationId === '' ? true : String(item.locationId) === selectedLocationId;
    return matchSearch && matchStatus && matchLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" /> Từ chối</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3.5 h-3.5" /> Chờ duyệt</span>;
    }
  };

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Yêu cầu Trồng cây">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Thanh công cụ tìm kiếm & lọc */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[280px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm mã vị trí, tên cây, tên khách..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm outline-none transition" 
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
                { value: "PENDING", label: "Chờ phê duyệt" },
                { value: "APPROVED", label: "Đã phê duyệt" },
                { value: "REJECTED", label: "Đã từ chối" },
              ]}
            />

            {/* Location Filter (chỉ manager/admin — location_manager đã bị giới hạn 1 cơ sở sẵn ở Backend) */}
            {canFilterByLocation && (
              <CustomDropdown
                icon={<MapPin className="w-4 h-4 text-green-600 shrink-0" />}
                value={selectedLocationId}
                onChange={(val: any) => setSelectedLocationId(String(val))}
                options={[
                  { value: "", label: "Tất cả cơ sở" },
                  ...locations.map((l: any) => ({ value: String(l.id), label: l.name }))
                ]}
              />
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

        {/* Bảng dữ liệu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Vị trí & Cây trồng</th>
                <th className="p-4 font-semibold text-gray-600">Khách hàng yêu cầu</th>
                <th className="p-4 font-semibold text-gray-600">Lý do trồng</th>
                <th className="p-4 font-semibold text-gray-600">Thời gian</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải danh sách yêu cầu...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Sprout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy yêu cầu trồng cây nào.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-gray-900">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {item.slotNumber || `Slot #${item.rentalId}`}
                      </div>
                      {item.locationName && (
                        <div className="text-xs text-gray-400 mt-0.5">{item.locationName}</div>
                      )}
                      <div className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5">
                        <Sprout className="w-3 h-3" />
                        {item.newTreeName || `Cây ID: ${item.newTreeId}`}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-500" />
                        {item.requestedByName || `Khách ID: ${item.requestedById}`}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-xs max-w-xs truncate">
                      {item.reason || 'Không nêu lý do'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(item.requestedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(item.requestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenDetail(item)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-green-600 hover:bg-green-50 border border-gray-200 rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem / Xử lý
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Xem chi tiết & Xử lý */}
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Sprout className="w-5 h-5 text-green-600" />
                Chi tiết Yêu cầu Trồng cây #{selectedItem.id}
              </h2>

              {/* Thông tin Chi tiết */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách hàng:</span>
                  <span className="font-semibold text-gray-900">{selectedItem.requestedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vị trí (Slot):</span>
                  <span className="font-bold text-green-600">{selectedItem.slotNumber} (Rental ID: {selectedItem.rentalId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giống cây yêu cầu:</span>
                  <span className="font-semibold text-gray-900">{selectedItem.newTreeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>
                  <div>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="text-gray-500 block text-xs mb-1">Lý do khách gửi:</span>
                  <p className="font-medium text-gray-800 bg-white p-2 rounded-lg border border-gray-200/60 text-xs italic">
                    "{selectedItem.reason || 'Không có lý do'}"
                  </p>
                </div>
              </div>

              {/* Ghi chú phản hồi từ Quản lý */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Ghi chú của Quản lý / Phản hồi cho khách
                </label>
                <textarea
                  rows={3}
                  disabled={selectedItem.status !== 'PENDING'}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 transition"
                  value={processNotes}
                  onChange={e => setProcessNotes(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do từ chối (nếu có)..."
                />
              </div>

              {/* Thông tin người đã xử lý (nếu có) */}
              {selectedItem.status !== 'PENDING' && selectedItem.processedByName && (
                <div className="text-xs text-gray-400 italic mb-4 text-right">
                  Đã xử lý bởi: <span className="font-medium text-gray-600">{selectedItem.processedByName}</span> vào lúc {new Date(selectedItem.processedAt || '').toLocaleString('vi-VN')}
                </div>
              )}

              {/* Các nút hành động */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition"
                >
                  Đóng
                </button>
                
                {/* Chỉ hiện Nút Phê duyệt / Từ chối khi trạng thái là PENDING */}
                {selectedItem.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleProcessRequest('REJECTED')}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition inline-flex items-center gap-1"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleProcessRequest('APPROVED')}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-green-600/20 inline-flex items-center gap-1"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Phê duyệt trồng
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}