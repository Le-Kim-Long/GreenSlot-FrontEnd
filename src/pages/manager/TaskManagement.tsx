import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { taskApi } from '../../api/taskApi';
import { managerApi, LocationItem, GardenStaff } from '../../api/managerApi';
import { 
  ClipboardList, UserPlus, X, Plus, Search, 
  MapPin, UserCheck, Loader2, Eye, Image as ImageIcon, 
  ExternalLink, CheckCircle, Calendar, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { staffNavItems } from './staffNav'; 

// Interfaces
interface Task {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  slotId?: number;
  slotNumber?: string;
  assigneeName?: string;
  evidenceImageUrl?: string;
  rejectionReason?: string;
  createdAt?: string;
}

interface Slot {
  id: number;
  slotNumber?: string;
}

const TASK_TYPE_MAP: Record<string, string> = {
  MAINTENANCE: 'Bảo trì / Kỹ thuật',
  CLEANING: 'Vệ sinh',
  PLANTING: 'Gieo trồng & Chăm sóc',
  HARVEST: 'Thu hoạch',
  INSPECTION: 'Kiểm tra',
  INCIDENT: 'Sự cố',
  REQUEST: 'Yêu cầu dịch vụ',
};

const TASK_STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ gán',
  IN_PROGRESS: 'Đang thực hiện',
  PENDING_APPROVAL: 'Chờ duyệt',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
};

export default function TaskManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // States cho Dropdown Lọc
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => user?.locationId ? String(user.locationId) : '');
  const [filteredStaffs, setFilteredStaffs] = useState<GardenStaff[]>([]);
  const [isLoadingStaffs, setIsLoadingStaffs] = useState(false);

  // States quản lý Modal
  const [modalType, setModalType] = useState<'CREATE' | 'ASSIGN' | 'REVIEW' | 'DETAIL' | 'IMAGE_PREVIEW' | 'NONE'>('NONE');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    taskName: '',
    description: '',
    taskType: 'MAINTENANCE',
    targetSlotId: '',
    evidenceImageUrl: ''
  });
  const [assignForm, setAssignForm] = useState({ staffId: '' });
  const [reviewForm, setReviewForm] = useState({ action: 'APPROVE' as 'APPROVE' | 'REJECT', rejectionReason: '' });

  // Tải dữ liệu ban đầu
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [slotsData, locationsData, tasksData] = await Promise.all([
        managerApi.getSlots().catch(() => []),
        managerApi.getLocations().catch(() => []),
        taskApi.getAllTasks().catch(() => [])
      ]);

      setSlots(slotsData);
      setLocations(locationsData);
      if (locationsData.length > 0 && !selectedLocationId) {
        const target = user?.locationId ? locationsData.find((l: any) => l.id === user.locationId) || locationsData[0] : locationsData[0];
        setSelectedLocationId(String(target.id));
      }

      // Map dữ liệu từ API để khớp với UI
      const formattedTasks = tasksData.map((t: any) => ({
        id: t.id,
        name: t.taskName,
        description: t.description || '',
        type: t.taskType || 'MAINTENANCE',
        status: t.status || 'PENDING',
        slotId: t.targetSlotId,
        slotNumber: t.targetSlotNumber || (t.targetSlotId ? `#${t.targetSlotId}` : 'N/A'),
        assigneeName: t.assignedStaffName,
        evidenceImageUrl: t.evidenceImageUrl || '',
        rejectionReason: t.rejectionReason || '',
        createdAt: t.createdAt || ''
      }));

      setTasks(formattedTasks); 
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.locationId]);

  // Lấy danh sách Staff khi đổi Location
  useEffect(() => {
    if (!selectedLocationId) {
      setFilteredStaffs([]);
      return;
    }
    const fetchStaffs = async () => {
      setIsLoadingStaffs(true);
      try {
        const staffs = await managerApi.getGardenStaffsByLocation(Number(selectedLocationId));
        setFilteredStaffs(staffs);
      } catch (err) {
        console.error('Không thể lấy danh sách nhân viên:', err);
        setFilteredStaffs([]);
      } finally {
        setIsLoadingStaffs(false);
      }
    };
    fetchStaffs();
  }, [selectedLocationId]);

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setCreateForm({ taskName: '', description: '', taskType: 'MAINTENANCE', targetSlotId: '', evidenceImageUrl: '' });
    setModalType('CREATE');
  };

  const handleOpenAssignModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedLocationId(user?.locationId ? String(user.locationId) : '');
    setAssignForm({ staffId: '' });
    setModalType('ASSIGN');
  };

  const handleOpenReviewModal = (task: Task) => {
    setSelectedTask(task);
    setReviewForm({ action: 'APPROVE', rejectionReason: '' });
    setModalType('REVIEW');
  };

  const handleOpenDetailModal = (task: Task) => {
    setSelectedTask(task);
    setModalType('DETAIL');
  };

  const handleOpenImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setModalType('IMAGE_PREVIEW');
  };

  const handleCloseModal = () => {
    setModalType('NONE');
    setSelectedTask(null);
    setPreviewImageUrl('');
  };

  // Upload hình ảnh khi tạo task (hỗ trợ mọi dung lượng)
  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingImage(true);
      try {
        const url = await taskApi.uploadEvidenceImage(file);
        setCreateForm(prev => ({ ...prev, evidenceImageUrl: url }));
        toast.success('Tải ảnh hướng dẫn thành công!');
      } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Upload/cập nhật ảnh bằng chứng trực tiếp trong Detail Modal
  const [detailFile, setDetailFile] = useState<File | null>(null);
  const [detailFilePreview, setDetailFilePreview] = useState<string | null>(null);
  const [isUpdatingDetailImage, setIsUpdatingDetailImage] = useState(false);

  const handleDetailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDetailFile(file);
      // Giải phóng Blob URL cũ trước khi tạo mới để tránh rò rỉ bộ nhớ
      if (detailFilePreview) URL.revokeObjectURL(detailFilePreview);
      setDetailFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDetailImage = async () => {
    if (!selectedTask || !detailFile) return;
    setIsUpdatingDetailImage(true);
    try {
      const publicUrl = await taskApi.uploadEvidenceImage(detailFile);
      await taskApi.updateTaskEvidence(selectedTask.id, publicUrl);
      setSelectedTask({ ...selectedTask, evidenceImageUrl: publicUrl });
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, evidenceImageUrl: publicUrl } : t));
      setDetailFile(null);
      setDetailFilePreview(null);
      toast.success('Đã cập nhật ảnh thực tế thành công!');
    } catch (e: any) {
      console.error(e);
      toast.error('Lỗi cập nhật ảnh: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsUpdatingDetailImage(false);
    }
  };

  // Submit tạo task
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taskName || !createForm.targetSlotId) {
      toast.warning('Vui lòng nhập đầy đủ Tên công việc và chọn Ô vườn!');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        taskName: createForm.taskName,
        description: createForm.description,
        taskType: createForm.taskType,
        targetSlotId: Number(createForm.targetSlotId),
        evidenceImageUrl: createForm.evidenceImageUrl || undefined
      };
      await taskApi.createTask(payload);
      toast.success('Tạo công việc thành công! Task đang ở trạng thái chờ phân công.');
      handleCloseModal();
      fetchData(); 
    } catch (error) {
      console.error('Lỗi tạo task:', error);
      toast.error('Tạo công việc thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit gán nhân viên
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.staffId || !selectedTask) {
      toast.warning('Vui lòng chọn Nhân viên thực hiện!');
      return;
    }
    setIsSubmitting(true);
    try {
      const taskId = selectedTask.id;
      const staffId = Number(assignForm.staffId);
      await taskApi.assignTask(taskId, staffId);
      toast.success('Giao việc thành công!');
      handleCloseModal();
      fetchData(); 
    } catch (error: any) {
      console.error('Lỗi giao việc:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Giao việc thất bại. Lý do: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit duyệt / từ chối task
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    try {
      await taskApi.reviewTask(selectedTask.id, reviewForm);
      if (reviewForm.action === 'APPROVE') {
        toast.success('Đã duyệt hoàn thành công việc!');
      } else {
        toast.warning('Đã từ chối công việc (yêu cầu làm lại)!');
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Lỗi duyệt task:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Lỗi khi duyệt task: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks
    .filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
        (t.slotNumber && t.slotNumber.toLowerCase().includes(search.toLowerCase())) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Công việc">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm tên công việc, ô vườn, nhân viên..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm outline-none transition" 
                value={search} 
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ gán / Chờ xử lý</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="PENDING_APPROVAL">Chờ duyệt (Có ảnh)</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>

          <button 
            onClick={handleOpenCreateModal} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition text-sm shadow-sm shadow-green-600/20"
          >
            <Plus className="w-4 h-4" /> 
            Tạo công việc mới
          </button>
        </div>

        {/* Bảng Danh sách Task */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Danh sách công việc & Hình ảnh minh chứng</h2>
            </div>
            <span className="text-xs text-gray-500 font-medium">Tổng số: {filteredTasks.length} công việc</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">ID</th>
                  <th className="p-4 font-semibold text-gray-600">Tên công việc</th>
                  <th className="p-4 font-semibold text-gray-600">Ô vườn</th>
                  <th className="p-4 font-semibold text-gray-600">Loại</th>
                  <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">Hình ảnh</th>
                  <th className="p-4 font-semibold text-gray-600">Người thực hiện</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />Đang tải dữ liệu...</td></tr>
                ) : filteredTasks.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Chưa có công việc nào phù hợp.</td></tr>
                ) : (
                  paginatedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 font-mono">#{task.id}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{task.name}</div>
                        {task.description ? (
                          <div className="text-xs text-gray-400 truncate max-w-xs">{task.description}</div>
                        ) : null}
                      </td>
                      <td className="p-4 font-medium text-green-700">{task.slotNumber}</td>
                      <td className="p-4 text-gray-600 text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded font-medium">{TASK_TYPE_MAP[task.type] || task.type}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                          task.status === 'PENDING_APPROVAL' ? 'bg-purple-100 text-purple-700' :
                          task.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.status === 'PENDING' ? 'Chờ gán' :
                           task.status === 'IN_PROGRESS' ? 'Đang làm' :
                           task.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                           task.status === 'REJECTED' ? 'Bị từ chối' :
                           'Hoàn thành'}
                        </span>
                      </td>

                      {/* Cột Hình ảnh Bằng chứng */}
                      <td className="p-4 text-center">
                        {task.evidenceImageUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenImagePreview(task.evidenceImageUrl!)}
                            className="group relative inline-block rounded-lg overflow-hidden border border-green-300 shadow-sm hover:ring-2 hover:ring-green-500 transition"
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img
                              src={task.evidenceImageUrl}
                              alt="Bằng chứng"
                              className="w-12 h-12 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Ảnh';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 italic flex items-center justify-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-gray-300" /> Chưa có
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {task.assigneeName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                              {task.assigneeName.charAt(0)}
                            </div>
                            <span className="text-gray-700 font-medium text-xs">{task.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Chưa phân công</span>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Nút Xem chi tiết mọi Task */}
                          <button
                            onClick={() => handleOpenDetailModal(task)}
                            className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg transition text-xs font-medium"
                            title="Xem chi tiết thông tin & ảnh"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>

                          {/* Gán nhân viên khi task PENDING và chưa có người làm */}
                          {task.status === 'PENDING' && !task.assigneeName && (
                            <button
                              onClick={() => handleOpenAssignModal(task)}
                              className="inline-flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg transition text-xs font-medium"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Gán
                            </button>
                          )}
                          
                          {/* Duyệt khi task PENDING_APPROVAL */}
                          {task.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleOpenReviewModal(task)}
                              className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Duyệt task
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTasks.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTasks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="công việc"
              />
            </div>
          )}
        </div>

        {/* =========================================
            MODAL 1: TẠO CÔNG VIỆC MỚI
        ========================================= */}
        {modalType === 'CREATE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900">Tạo công việc mới</h2>
              <form onSubmit={handleCreateSubmit} noValidate className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                  <input required className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 outline-none" 
                    value={createForm.taskName} onChange={e => setCreateForm({...createForm, taskName: e.target.value})} placeholder="VD: Nhổ cỏ & bón phân khu A" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Mô tả chi tiết</label>
                  <textarea className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 outline-none" 
                    rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Ghi chú hướng dẫn cho nhân viên..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5">Loại công việc</label>
                    <select className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 bg-white outline-none"
                      value={createForm.taskType} onChange={e => setCreateForm({...createForm, taskType: e.target.value})}>
                      <option value="MAINTENANCE">Bảo trì / Chăm sóc</option>
                      <option value="CLEANING">Dọn dẹp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5">Ô vườn (Slot) <span className="text-red-500">*</span></label>
                    <select required className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 bg-white outline-none"
                      value={createForm.targetSlotId} onChange={e => setCreateForm({...createForm, targetSlotId: e.target.value})}>
                      <option value="" disabled>-- Chọn ô --</option>
                      {slots.map(s => <option key={s.id} value={s.id}>Ô {s.slotNumber || `#${s.id}`}</option>)}
                    </select>
                  </div>
                </div>

                {/* Upload ảnh hướng dẫn tùy chọn */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Ảnh hướng dẫn đính kèm (Tùy chọn)</label>
                  <div className="flex items-center gap-3">
                    <label className={clsx(
                      "inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all",
                      isUploadingImage && "opacity-50 pointer-events-none"
                    )}>
                      {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{isUploadingImage ? 'Đang gửi ảnh...' : createForm.evidenceImageUrl ? 'Gửi ảnh khác' : 'Gửi ảnh'}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCreateImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    {createForm.evidenceImageUrl && (
                      <div className="flex items-center gap-2">
                        <img src={createForm.evidenceImageUrl} alt="Preview" className="w-9 h-9 object-cover rounded-lg border border-green-300" />
                        <span className="text-xs text-green-700 font-medium">Đã đính kèm ảnh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Hủy</button>
                  <button type="submit" disabled={isSubmitting || isUploadingImage} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-green-600/20">
                    <Plus className="w-4 h-4" /> {isSubmitting ? 'Đang tạo...' : 'Lưu công việc'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 2: PHÂN CÔNG NHÂN VIÊN
        ========================================= */}
        {modalType === 'ASSIGN' && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900">Phân công nhân viên</h2>
              
              <div className="bg-green-50/60 border border-green-100 p-4 rounded-xl mb-5">
                <p className="font-semibold text-gray-900 text-base">{selectedTask.name}</p>
                <div className="flex gap-4 mt-2 text-xs font-medium text-green-700 bg-white inline-flex px-3 py-1.5 rounded-lg border border-green-200">
                  <span>Loại: {selectedTask.type}</span>
                  <span className="w-px bg-green-200"></span>
                  <span>Ô vườn: {selectedTask.slotNumber}</span>
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} noValidate className="space-y-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-green-600" />
                    <span>Lọc và chọn nhân sự</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">1. Cơ sở / Chi nhánh</label>
                    <select value={selectedLocationId} onChange={(e) => { setSelectedLocationId(e.target.value); setAssignForm({ staffId: '' }); }}
                      className="w-full border border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 bg-white outline-none">
                      <option value="">-- Chọn cơ sở để lọc nhân viên --</option>
                      {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5 flex justify-between">
                      <span>2. Nhân viên thực hiện <span className="text-red-500">*</span></span>
                      {isLoadingStaffs && <span className="text-green-600 italic flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tải...</span>}
                    </label>
                    <select required disabled={isLoadingStaffs || !selectedLocationId}
                      value={assignForm.staffId} onChange={(e) => setAssignForm({ staffId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 bg-white outline-none disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="" disabled>
                        {!selectedLocationId ? '-- Vui lòng chọn cơ sở trước --' : filteredStaffs.length === 0 ? '-- Không có nhân viên tại cơ sở này --' : '-- Chọn nhân viên --'}
                      </option>
                      {filteredStaffs.map((staff) => (
                        <option key={staff.id} value={staff.id}>{staff.fullName} {staff.username ? `(${staff.username})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Hủy</button>
                  <button type="submit" disabled={isSubmitting || !assignForm.staffId} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-green-600/20">
                    <UserCheck className="w-4 h-4" /> {isSubmitting ? 'Đang xử lý...' : 'Xác nhận giao'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 3: DUYỆT CÔNG VIỆC (REVIEW)
        ========================================= */}
        {modalType === 'REVIEW' && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900">Duyệt Công Việc</h2>
              
              <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl mb-5">
                <p className="font-semibold text-gray-900 text-base">{selectedTask.name}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs font-medium text-purple-700">
                  <span className="bg-white px-2 py-1 rounded border border-purple-200">Loại: {TASK_TYPE_MAP[selectedTask.type] || selectedTask.type}</span>
                  <span className="bg-white px-2 py-1 rounded border border-purple-200">Ô vườn: {selectedTask.slotNumber}</span>
                  <span className="bg-white px-2 py-1 rounded border border-purple-200">Nhân viên: {selectedTask.assigneeName || 'Chưa gán'}</span>
                </div>
              </div>

              {/* Hiển thị Ảnh Bằng Chứng Rõ Ràng */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>📸 Ảnh Bằng Chứng Hoàn Thành</span>
                  {selectedTask.evidenceImageUrl && (
                    <a 
                      href={selectedTask.evidenceImageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-normal"
                    >
                      Mở toàn màn hình <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                
                {selectedTask.evidenceImageUrl ? (
                  <div className="rounded-xl overflow-hidden border-2 border-purple-200 bg-gray-900 flex items-center justify-center min-h-[220px]">
                    <img 
                      src={selectedTask.evidenceImageUrl} 
                      alt="Bằng chứng công việc" 
                      className="w-full max-h-80 object-contain cursor-pointer hover:opacity-95 transition"
                      onClick={() => handleOpenImagePreview(selectedTask.evidenceImageUrl!)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Lỗi+hiển+thị+ảnh';
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-yellow-800 text-sm">
                    ⚠️ Nhân viên chưa đính kèm ảnh bằng chứng.
                  </div>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} noValidate className="space-y-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quyết định phê duyệt</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl flex-1 hover:bg-green-50/50 transition">
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="APPROVE"
                        checked={reviewForm.action === 'APPROVE'}
                        onChange={() => setReviewForm({ ...reviewForm, action: 'APPROVE' })}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-semibold text-green-700">Duyệt (Hoàn thành)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl flex-1 hover:bg-red-50/50 transition">
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="REJECT"
                        checked={reviewForm.action === 'REJECT'}
                        onChange={() => setReviewForm({ ...reviewForm, action: 'REJECT' })}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-red-700">Từ chối (Làm lại)</span>
                    </label>
                  </div>
                </div>

                {reviewForm.action === 'REJECT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do từ chối <span className="text-red-500">*</span></label>
                    <textarea 
                      required 
                      className="w-full border border-red-300 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 p-2.5 outline-none" 
                      rows={3} 
                      value={reviewForm.rejectionReason} 
                      onChange={e => setReviewForm({...reviewForm, rejectionReason: e.target.value})} 
                      placeholder="Nhập lý do nhân viên cần làm lại (VD: Cây tỉa chưa sạch, góc chụp mờ...)" 
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${reviewForm.action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
                    <CheckCircle className="w-4 h-4" /> {isSubmitting ? 'Đang xử lý...' : (reviewForm.action === 'APPROVE' ? 'Xác nhận duyệt' : 'Xác nhận từ chối')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 4: XEM CHI TIẾT TASK (DETAIL)
        ========================================= */}
        {modalType === 'DETAIL' && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" />
                Chi tiết công việc #{selectedTask.id}
              </h2>

              <div className="space-y-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{selectedTask.name}</h3>
                      <p className="text-xs text-gray-500">Ô vườn: <span className="font-semibold text-green-700">{selectedTask.slotNumber}</span> · Loại: <span className="font-medium text-gray-700">{TASK_TYPE_MAP[selectedTask.type] || selectedTask.type}</span></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedTask.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                      selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                      selectedTask.status === 'PENDING_APPROVAL' ? 'bg-purple-100 text-purple-700' :
                      selectedTask.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {TASK_STATUS_MAP[selectedTask.status] || selectedTask.status}
                    </span>
                  </div>

                  {selectedTask.description && (
                    <div className="text-gray-700 text-xs bg-white p-3 rounded-lg border border-gray-200">
                      <span className="font-semibold block mb-1">Mô tả:</span>
                      {selectedTask.description}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
                    <span>Nhân viên: <strong className="text-gray-900">{selectedTask.assigneeName || 'Chưa phân công'}</strong></span>
                    {selectedTask.createdAt && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedTask.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {selectedTask.rejectionReason && (
                    <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      <span className="font-bold block mb-1">⚠️ Lý do từ chối:</span>
                      {selectedTask.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Phần Hình ảnh Minh chứng */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                      Hình ảnh bằng chứng / Thực tế
                    </label>
                    {selectedTask.evidenceImageUrl && !selectedTask.evidenceImageUrl.includes('placehold.co') && (
                      <a
                        href={selectedTask.evidenceImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                      >
                        Mở ảnh gốc <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedTask.evidenceImageUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 flex items-center justify-center min-h-[200px] relative">
                        <img
                          src={selectedTask.evidenceImageUrl}
                          alt="Bằng chứng công việc"
                          className="w-full max-h-80 object-contain cursor-pointer hover:opacity-95 transition"
                          onClick={() => handleOpenImagePreview(selectedTask.evidenceImageUrl!)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Lỗi+tải+ảnh';
                          }}
                        />
                        {selectedTask.evidenceImageUrl.includes('placehold.co') && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs shadow-md">
                            ⚠️ Ảnh mẫu giả lập cũ
                          </div>
                        )}
                      </div>
                      {selectedTask.evidenceImageUrl.includes('placehold.co') && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          📌 <strong>Ghi chú:</strong> Đây là ảnh mẫu cũ do hệ thống tạo lúc trước khi chưa kết nối lưu trữ cục bộ. Hãy chọn file bên dưới để tải lên ảnh thực tế mới!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                      Chưa có hình ảnh bằng chứng cho công việc này.
                    </div>
                  )}

                  {/* Khu vực Tải lên / Cập nhật ảnh mới */}
                  <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-green-600" />
                      Tải lên / Thay thế bằng ảnh thực tế:
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all">
                        <Upload className="w-3.5 h-3.5 text-green-600" />
                        <span>{detailFile ? 'Gửi ảnh khác' : 'Gửi ảnh'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleDetailFileChange}
                          className="hidden"
                        />
                      </label>
                      {detailFile && (
                        <button
                          type="button"
                          onClick={handleSaveDetailImage}
                          disabled={isUpdatingDetailImage}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          {isUpdatingDetailImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Lưu ảnh này
                        </button>
                      )}
                    </div>
                    {detailFilePreview && (
                      <div className="mt-2 text-xs text-green-700 font-medium flex items-center gap-1">
                        <span>Đã chọn: <strong>{detailFile?.name}</strong> ({( (detailFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">
                    Đóng
                  </button>
                  {selectedTask.status === 'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(selectedTask)}
                      className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Duyệt công việc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 5: PHÓNG TO HÌNH ẢNH (LIGHTBOX)
        ========================================= */}
        {modalType === 'IMAGE_PREVIEW' && previewImageUrl && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <div className="relative max-w-4xl max-h-[90vh] bg-transparent p-2" onClick={e => e.stopPropagation()}>
              <button 
                onClick={handleCloseModal} 
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={previewImageUrl} 
                alt="Phóng to" 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20 bg-gray-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Lỗi+tải+ảnh';
                }}
              />
              <div className="text-center mt-3">
                <a 
                  href={previewImageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở trong tab mới
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}