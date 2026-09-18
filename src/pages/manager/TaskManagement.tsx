import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { taskApi } from '../../api/taskApi';
import { managerApi, LocationItem, GardenStaff } from '../../api/managerApi';
import { iotApi, PillarIoTStatus } from '../../api/iotApi';
import type { PillarEquipmentBinding } from '../../types/api';
import { 
  ClipboardList, UserPlus, X, Plus, Search, 
  MapPin, UserCheck, Loader2, Eye, Image as ImageIcon, 
  ExternalLink, CheckCircle, Calendar, Upload,
  Cpu, Wifi, AlertTriangle, FileText, Maximize2
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
  pillarCodes?: string;
  staffNotes?: string;
  equipmentBindings?: PillarEquipmentBinding[];
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
        createdAt: t.createdAt || '',
        pillarCodes: t.pillarCodes || '',
        staffNotes: t.staffNotes || '',
        equipmentBindings: t.equipmentBindings || []
      }));

      setTasks(formattedTasks); 
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.locationId]);

  // States lưu trữ thông tin thiết bị và cảm biến IoT của các trụ trong task
  const [pillarIoTStatuses, setPillarIoTStatuses] = useState<Record<string, PillarIoTStatus>>({});
  const [isLoadingPillarIoT, setIsLoadingPillarIoT] = useState(false);

  const loadPillarIoT = async (pCodesStr?: string) => {
    if (!pCodesStr) {
      setPillarIoTStatuses({});
      return;
    }
    const codes = pCodesStr.split(',').map(s => s.trim()).filter(Boolean);
    if (codes.length === 0) {
      setPillarIoTStatuses({});
      return;
    }
    setIsLoadingPillarIoT(true);
    try {
      const results = await Promise.allSettled(
        codes.map(c => iotApi.getPillarIoTStatus(c))
      );
      const statusMap: Record<string, PillarIoTStatus> = {};
      results.forEach((res, idx) => {
        const code = codes[idx];
        if (res.status === 'fulfilled' && res.value) {
          statusMap[code] = res.value;
        }
      });
      setPillarIoTStatuses(statusMap);
    } catch (e) {
      console.error('Lỗi khi tải trạng thái IoT của trụ:', e);
    } finally {
      setIsLoadingPillarIoT(false);
    }
  };

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
    loadPillarIoT(task.pillarCodes);
  };

  const handleOpenDetailModal = (task: Task) => {
    setSelectedTask(task);
    setModalType('DETAIL');
    loadPillarIoT(task.pillarCodes);
  };

  const handleOpenImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setModalType('IMAGE_PREVIEW');
  };

  const handleCloseModal = () => {
    setModalType('NONE');
    setSelectedTask(null);
    setPreviewImageUrl('');
    setPillarIoTStatuses({});
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

  // Submit hủy phân công (bỏ gán) nhân viên
  const handleUnassign = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      await taskApi.assignTask(selectedTask.id, 0);
      toast.success('Đã hủy phân công nhân viên thành công! Task trở về trạng thái chờ phân công.');
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      console.error('Lỗi hủy phân công:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Hủy phân công thất bại: ${errorMsg}`);
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
                        {task.description ? (() => {
                          const isSetup = (task.name || '').toLowerCase().includes('lắp đặt bổ sung') ||
                                          (task.name || '').toLowerCase().includes('lắp đặt trụ') ||
                                          (task.name || '').toLowerCase().includes('bổ sung trụ');
                          const displayDesc = (!isSetup && task.description.includes('[HƯỚNG DẪN THIẾT BỊ IOT]'))
                            ? task.description.split('[HƯỚNG DẪN THIẾT BỊ IOT]')[0].trim()
                            : task.description;

                          return (
                            <div className="text-xs text-gray-500 bg-gray-50/80 p-2 rounded-lg border border-gray-100 mt-1.5 whitespace-pre-line leading-relaxed">
                              {displayDesc}
                            </div>
                          );
                        })() : null}
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

                          {/* Gán / Đổi nhân viên khi task PENDING */}
                          {task.status === 'PENDING' && (
                            <button
                              onClick={() => handleOpenAssignModal(task)}
                              className="inline-flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg transition text-xs font-medium"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> {task.assigneeName ? 'Đổi NV' : 'Gán'}
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
                  {selectedTask?.assigneeName ? (
                    <button
                      type="button"
                      onClick={handleUnassign}
                      disabled={isSubmitting}
                      className="px-3.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 font-medium text-xs flex items-center gap-1 transition"
                    >
                      Bỏ phân công (Hủy gán)
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-xs">Hủy</button>
                    <button type="submit" disabled={isSubmitting || !assignForm.staffId} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-green-600/20">
                      <UserCheck className="w-4 h-4" /> {isSubmitting ? 'Đang xử lý...' : selectedTask?.assigneeName ? 'Đổi nhân viên' : 'Xác nhận giao'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================
            MODAL 3: DUYỆT CÔNG VIỆC (REVIEW)
        ========================================= */}
        {modalType === 'REVIEW' && selectedTask && (() => {
          const isPillarSetupTask = Boolean(
            selectedTask.pillarCodes &&
            selectedTask.pillarCodes.trim() !== '' &&
            (selectedTask.name.toLowerCase().includes('lắp đặt bổ sung') ||
             selectedTask.name.toLowerCase().includes('lắp đặt trụ') ||
             selectedTask.name.toLowerCase().includes('bổ sung trụ'))
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
              <div className={clsx("bg-white rounded-2xl shadow-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto transition-all", isPillarSetupTask ? "max-w-3xl" : "max-w-lg")}>
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

                {/* Nếu là Task Lắp đặt bổ sung trụ: Hiển thị Thẻ (Card) chi tiết từng trụ */}
                {isPillarSetupTask ? (
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                        <Cpu className="w-4 h-4 text-indigo-600" />
                        <span>Chi tiết nghiệm thu theo từng trụ ({selectedTask.pillarCodes?.split(',').filter(Boolean).length || 0} trụ)</span>
                      </div>
                      <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {selectedTask.pillarCodes}
                      </span>
                    </div>

                    {isLoadingPillarIoT ? (
                      <div className="flex items-center justify-center py-8 text-xs text-gray-500 gap-2 bg-gray-50 rounded-xl border border-gray-200">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Đang kiểm tra thông tin thiết bị và tín hiệu cảm biến...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedTask.pillarCodes?.split(',').map(s => s.trim()).filter(Boolean).map((code, idx) => {
                          const status = pillarIoTStatuses[code];
                          const binding = selectedTask.equipmentBindings?.find(b => b.pillarCode?.trim() === code);

                          // Phân giải ảnh của trụ
                          let pillarImg = binding?.evidenceImageUrl;
                          if (!pillarImg && selectedTask.evidenceImageUrl) {
                            const images = selectedTask.evidenceImageUrl.split(',').map(s => s.trim()).filter(Boolean);
                            if (idx < images.length) pillarImg = images[idx];
                            else if (images.length === 1) pillarImg = images[0];
                          }

                          // Phân giải ghi chú của trụ
                          let pillarNote = binding?.notes;
                          if (!pillarNote && selectedTask.staffNotes) {
                            const lines = selectedTask.staffNotes.split('\n');
                            for (const line of lines) {
                              if (line.trim().startsWith(`[${code}]:`)) {
                                pillarNote = line.trim().substring(`[${code}]:`.length).trim();
                                break;
                              }
                            }
                          }

                          return (
                            <div key={code} className="bg-white rounded-xl border-2 border-indigo-100 p-4 shadow-xs hover:shadow-sm transition space-y-3">
                              {/* Header của thẻ trụ: Mã trụ & Trạng thái tín hiệu */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                                <span className="text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                                  Trụ: {code}
                                </span>
                                {status?.hasSignal ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Đã kết nối tín hiệu
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Chưa nhận tín hiệu
                                  </span>
                                )}
                              </div>

                              {/* Thân thẻ: 2 cột */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cột 1: Thiết bị, Cảm biến, Ghi chú */}
                                <div className="space-y-2.5 text-xs">
                                  {/* Thiết bị IoT */}
                                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                    <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                      <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Thiết bị IoT đã gắn:
                                    </div>
                                    {(status?.equipments && status.equipments.length > 0) || binding?.newEquipmentName ? (
                                      <div className="space-y-1">
                                        {status?.equipments && status.equipments.length > 0 ? (
                                          status.equipments.map(eq => (
                                            <div key={eq.id} className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-200">
                                              <span className="font-medium text-gray-800">{eq.equipmentName}</span>
                                              <span className="font-mono text-gray-500 text-[10px]">SN: {eq.serialNumber || 'N/A'}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-200">
                                            <span className="font-medium text-gray-800">{binding?.newEquipmentName}</span>
                                            <span className="font-mono text-gray-500 text-[10px]">SN: {binding?.newSerialNumber || 'N/A'}</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-rose-600 font-medium">
                                        ⚠️ Chưa có thiết bị IoT nào được gắn vào trụ này!
                                      </div>
                                    )}
                                  </div>

                                  {/* Trạng thái cảm biến */}
                                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                    <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                      <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Trạng thái cảm biến:
                                    </div>
                                    {status?.latestSensorReading ? (
                                      <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100 text-emerald-900 grid grid-cols-2 gap-1 text-[11px]">
                                        {status.latestSensorReading.temperature != null && (
                                          <div>Nhiệt độ: <strong>{status.latestSensorReading.temperature}°C</strong></div>
                                        )}
                                        {status.latestSensorReading.humidity != null && (
                                          <div>Độ ẩm KK: <strong>{status.latestSensorReading.humidity}%</strong></div>
                                        )}
                                        {status.latestSensorReading.ph != null && (
                                          <div>pH: <strong>{status.latestSensorReading.ph}</strong></div>
                                        )}
                                        {status.latestSensorReading.soilMoisture != null && (
                                          <div>Độ ẩm đất: <strong>{status.latestSensorReading.soilMoisture}%</strong></div>
                                        )}
                                        {status.latestSensorReading.waterLevel != null && (
                                          <div>Mực nước: <strong>{status.latestSensorReading.waterLevel}cm</strong></div>
                                        )}
                                        {status.latestSensorReading.recordedAt && (
                                          <div className="col-span-2 text-[10px] text-gray-500 pt-1 border-t border-emerald-200/50 mt-0.5">
                                            Ghi nhận lúc: {new Date(status.latestSensorReading.recordedAt).toLocaleString('vi-VN')}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200 leading-tight">
                                        Chưa có số đo cảm biến (ESP32 chưa gửi dữ liệu telemetry).
                                      </div>
                                    )}
                                  </div>

                                  {/* Ghi chú thực tế */}
                                  <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                    <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5 text-amber-600" /> Ghi chú thực tế của nhân viên:
                                    </div>
                                    {pillarNote ? (
                                      <div className="bg-white p-2 rounded border border-amber-200 text-gray-800 text-xs leading-relaxed">
                                        {pillarNote}
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 italic text-[11px]">
                                        (Không có ghi chú thêm)
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Cột 2: Ảnh bằng chứng riêng của trụ */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5 text-xs">
                                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> Ảnh bằng chứng của trụ:
                                    </span>
                                    {pillarImg && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenImagePreview(pillarImg!)}
                                        className="text-purple-600 hover:text-purple-700 text-[11px] font-medium flex items-center gap-0.5"
                                      >
                                        <Maximize2 className="w-3 h-3" /> Phóng to
                                      </button>
                                    )}
                                  </div>

                                  {pillarImg ? (
                                    <div 
                                      className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-900 cursor-pointer aspect-video flex items-center justify-center"
                                      onClick={() => handleOpenImagePreview(pillarImg!)}
                                    >
                                      <img 
                                        src={pillarImg} 
                                        alt={`Bằng chứng ${code}`} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Lỗi+hiển+thị+ảnh';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                        <Maximize2 className="w-4 h-4" /> Bấm để xem ảnh lớn
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-yellow-800 text-xs aspect-video flex flex-col items-center justify-center">
                                      <AlertTriangle className="w-6 h-6 text-amber-500 mb-1" />
                                      Chưa có ảnh bằng chứng cho trụ này.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Giao diện Task thông thường: Hiển thị 1 ảnh bằng chứng chung và ghi chú */
                  <>
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

                    {/* Ghi chú của nhân viên nếu có */}
                    {selectedTask.staffNotes && (
                      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                        <div className="font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600" /> Ghi chú của nhân viên:
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{selectedTask.staffNotes}</p>
                      </div>
                    )}
                  </>
                )}

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
          );
        })()}

        {/* =========================================
            MODAL 4: XEM CHI TIẾT TASK (DETAIL)
        ========================================= */}
        {modalType === 'DETAIL' && selectedTask && (() => {
          const isPillarSetupTask = Boolean(
            selectedTask.pillarCodes &&
            selectedTask.pillarCodes.trim() !== '' &&
            (selectedTask.name.toLowerCase().includes('lắp đặt bổ sung') ||
             selectedTask.name.toLowerCase().includes('lắp đặt trụ') ||
             selectedTask.name.toLowerCase().includes('bổ sung trụ'))
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
              <div className={clsx("bg-white rounded-2xl shadow-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto transition-all", isPillarSetupTask ? "max-w-3xl" : "max-w-xl")}>
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

                    {selectedTask.description && (() => {
                      const isSetup = (selectedTask.name || '').toLowerCase().includes('lắp đặt bổ sung') ||
                                      (selectedTask.name || '').toLowerCase().includes('lắp đặt trụ') ||
                                      (selectedTask.name || '').toLowerCase().includes('bổ sung trụ');
                      const displayDesc = (!isSetup && selectedTask.description.includes('[HƯỚNG DẪN THIẾT BỊ IOT]'))
                        ? selectedTask.description.split('[HƯỚNG DẪN THIẾT BỊ IOT]')[0].trim()
                        : selectedTask.description;

                      return (
                        <div className="text-gray-700 text-xs bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-line leading-relaxed">
                          <span className="font-semibold block mb-1">Mô tả:</span>
                          {displayDesc}
                        </div>
                      );
                    })()}

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

                  {/* Nếu là task Lắp đặt bổ sung trụ: Hiển thị Thẻ (Card) từng trụ */}
                  {isPillarSetupTask ? (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                          <span>Chi tiết thiết bị & cảm biến từng trụ</span>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {selectedTask.pillarCodes}
                        </span>
                      </div>

                      {isLoadingPillarIoT ? (
                        <div className="flex items-center justify-center py-6 text-xs text-gray-500 gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          Đang tải thông tin thiết bị và cảm biến...
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedTask.pillarCodes?.split(',').map(s => s.trim()).filter(Boolean).map((code, idx) => {
                            const status = pillarIoTStatuses[code];
                            const binding = selectedTask.equipmentBindings?.find(b => b.pillarCode?.trim() === code);

                            let pillarImg = binding?.evidenceImageUrl;
                            if (!pillarImg && selectedTask.evidenceImageUrl) {
                              const images = selectedTask.evidenceImageUrl.split(',').map(s => s.trim()).filter(Boolean);
                              if (idx < images.length) pillarImg = images[idx];
                              else if (images.length === 1) pillarImg = images[0];
                            }

                            let pillarNote = binding?.notes;
                            if (!pillarNote && selectedTask.staffNotes) {
                              const lines = selectedTask.staffNotes.split('\n');
                              for (const line of lines) {
                                if (line.trim().startsWith(`[${code}]:`)) {
                                  pillarNote = line.trim().substring(`[${code}]:`.length).trim();
                                  break;
                                }
                              }
                            }

                            return (
                              <div key={code} className="bg-white rounded-xl border border-indigo-100 p-4 shadow-xs space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                  <span className="text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Trụ: {code}
                                  </span>
                                  {status?.hasSignal ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Đã có tín hiệu
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Chưa nhận tín hiệu
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2 text-xs">
                                    <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                      <div className="font-semibold text-gray-700 mb-1">Thiết bị IoT:</div>
                                      {(status?.equipments && status.equipments.length > 0) || binding?.newEquipmentName ? (
                                        <div className="space-y-1">
                                          {status?.equipments && status.equipments.length > 0 ? (
                                            status.equipments.map(eq => (
                                              <div key={eq.id} className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-200">
                                                <span className="font-medium text-gray-800">{eq.equipmentName}</span>
                                                <span className="font-mono text-gray-500 text-[10px]">SN: {eq.serialNumber || 'N/A'}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-200">
                                              <span className="font-medium text-gray-800">{binding?.newEquipmentName}</span>
                                              <span className="font-mono text-gray-500 text-[10px]">SN: {binding?.newSerialNumber || 'N/A'}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-rose-600">
                                          ⚠️ Chưa gắn thiết bị IoT vào trụ này!
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                      <div className="font-semibold text-gray-700 mb-1">Chỉ số cảm biến:</div>
                                      {status?.latestSensorReading ? (
                                        <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100 text-emerald-900 grid grid-cols-2 gap-1 text-[11px]">
                                          {status.latestSensorReading.temperature != null && (
                                            <div>Nhiệt độ: <strong>{status.latestSensorReading.temperature}°C</strong></div>
                                          )}
                                          {status.latestSensorReading.humidity != null && (
                                            <div>Độ ẩm KK: <strong>{status.latestSensorReading.humidity}%</strong></div>
                                          )}
                                          {status.latestSensorReading.ph != null && (
                                            <div>pH: <strong>{status.latestSensorReading.ph}</strong></div>
                                          )}
                                          {status.latestSensorReading.soilMoisture != null && (
                                            <div>Độ ẩm đất: <strong>{status.latestSensorReading.soilMoisture}%</strong></div>
                                          )}
                                          {status.latestSensorReading.waterLevel != null && (
                                            <div>Mực nước: <strong>{status.latestSensorReading.waterLevel}cm</strong></div>
                                          )}
                                          {status.latestSensorReading.recordedAt && (
                                            <div className="col-span-2 text-[10px] text-gray-500 pt-1 border-t border-emerald-200/50 mt-0.5">
                                              Ghi nhận: {new Date(status.latestSensorReading.recordedAt).toLocaleString('vi-VN')}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200">
                                          Chưa có dữ liệu cảm biến gần đây (ESP32 chưa gửi dữ liệu telemetry).
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                      <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-amber-600" /> Ghi chú thực tế:
                                      </div>
                                      {pillarNote ? (
                                        <div className="bg-white p-2 rounded border border-amber-200 text-gray-800 text-xs">
                                          {pillarNote}
                                        </div>
                                      ) : (
                                        <div className="text-gray-400 italic text-[11px]">
                                          (Không có ghi chú thêm)
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1.5 text-xs">
                                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> Ảnh bằng chứng:
                                      </span>
                                      {pillarImg && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenImagePreview(pillarImg!)}
                                          className="text-purple-600 hover:text-purple-700 text-[11px] font-medium flex items-center gap-0.5"
                                        >
                                          <Maximize2 className="w-3 h-3" /> Phóng to
                                        </button>
                                      )}
                                    </div>

                                    {pillarImg ? (
                                      <div
                                        className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-900 cursor-pointer aspect-video flex items-center justify-center"
                                        onClick={() => handleOpenImagePreview(pillarImg!)}
                                      >
                                        <img
                                          src={pillarImg}
                                          alt={`Bằng chứng ${code}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Lỗi+tải+ảnh';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                          <Maximize2 className="w-4 h-4" /> Bấm để phóng to
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs aspect-video flex flex-col items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
                                        Chưa có ảnh bằng chứng cho trụ này.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Task thông thường: Giữ nguyên giao diện thiết bị nếu có & khung ảnh đơn lẻ */
                    <>
                      {/* Kiểm tra Thiết bị IoT & Tín hiệu Cảm biến các trụ nếu có */}
                      {selectedTask.pillarCodes && selectedTask.pillarCodes.trim() !== '' && (
                        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                              <Cpu className="w-4 h-4 text-indigo-600" />
                              <span>Thiết bị IoT & Cảm biến Trụ</span>
                            </div>
                            <span className="text-xs text-indigo-600 font-medium">
                              Trụ: {selectedTask.pillarCodes}
                            </span>
                          </div>

                          {isLoadingPillarIoT ? (
                            <div className="flex items-center justify-center py-4 text-xs text-gray-500 gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                              Đang lấy thông tin cảm biến...
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {selectedTask.pillarCodes.split(',').map(s => s.trim()).filter(Boolean).map(code => {
                                const status = pillarIoTStatuses[code];
                                return (
                                  <div key={code} className="bg-white rounded-lg p-3 border border-indigo-100 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                        Mã trụ: {code}
                                      </span>
                                      {status?.hasSignal ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <Wifi className="w-3 h-3 text-emerald-600" /> Đã có tín hiệu
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Chưa nhận tín hiệu
                                        </span>
                                      )}
                                    </div>

                                    {/* Thiết bị gắn trên trụ */}
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div className="font-semibold text-gray-700">Thiết bị IoT:</div>
                                      {status?.equipments && status.equipments.length > 0 ? (
                                        <div className="space-y-1 pl-2">
                                          {status.equipments.map(eq => (
                                            <div key={eq.id} className="flex items-center justify-between text-[11px] bg-gray-50 p-1.5 rounded">
                                              <span className="font-medium text-gray-800">{eq.equipmentName}</span>
                                              <span className="font-mono text-gray-500 text-[10px]">SN: {eq.serialNumber || 'N/A'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-rose-600 pl-2">
                                          ⚠️ Chưa gắn thiết bị IoT vào trụ này!
                                        </div>
                                      )}
                                    </div>

                                    {/* Chỉ số cảm biến */}
                                    {status?.latestSensorReading ? (
                                      <div className="bg-emerald-50/60 p-2 rounded text-[11px] border border-emerald-100 text-emerald-900 grid grid-cols-3 gap-1">
                                        {status.latestSensorReading.temperature != null && (
                                          <div>Nhiệt độ: <strong>{status.latestSensorReading.temperature}°C</strong></div>
                                        )}
                                        {status.latestSensorReading.humidity != null && (
                                          <div>Độ ẩm KK: <strong>{status.latestSensorReading.humidity}%</strong></div>
                                        )}
                                        {status.latestSensorReading.ph != null && (
                                          <div>pH: <strong>{status.latestSensorReading.ph}</strong></div>
                                        )}
                                        {status.latestSensorReading.soilMoisture != null && (
                                          <div>Độ ẩm đất: <strong>{status.latestSensorReading.soilMoisture}%</strong></div>
                                        )}
                                        {status.latestSensorReading.waterLevel != null && (
                                          <div>Mực nước: <strong>{status.latestSensorReading.waterLevel}cm</strong></div>
                                        )}
                                        {status.latestSensorReading.recordedAt && (
                                          <div className="col-span-3 text-[10px] text-gray-500 pt-0.5">
                                            Ghi nhận: {new Date(status.latestSensorReading.recordedAt).toLocaleString('vi-VN')}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200">
                                        Chưa có dữ liệu cảm biến gần đây (ESP32 chưa gửi dữ liệu telemetry).
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

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
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-xs">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                            Chưa có hình ảnh bằng chứng cho công việc này.
                          </div>
                        )}
                      </div>

                      {/* Ghi chú của nhân viên nếu có */}
                      {selectedTask.staffNotes && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                          <div className="font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600" /> Ghi chú của nhân viên:
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{selectedTask.staffNotes}</p>
                        </div>
                      )}
                    </>
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
          );
        })()}

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