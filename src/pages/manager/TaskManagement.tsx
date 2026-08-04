import React, { useState, useEffect } from 'react';
import { taskApi } from '../../api/taskApi';
import { managerApi, LocationItem, GardenStaff } from '../../api/managerApi';
import { 
  ClipboardList, UserPlus, X, Plus, Search, 
  MapPin, UserCheck, Loader2 
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav'; 

// Interfaces
interface Task {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  slotId: number;
  assigneeName?: string;
}

interface Slot {
  id: number;
  slotNumber?: string;
}

interface ServiceType {
  id: number;
  name: string;
  serviceName: string;
  description: string;
  price: number;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // States cho Dropdown Lọc
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [filteredStaffs, setFilteredStaffs] = useState<GardenStaff[]>([]);
  const [isLoadingStaffs, setIsLoadingStaffs] = useState(false);

  // States quản lý Modal (Tách biệt Tạo mới và Giao việc)
  const [modalType, setModalType] = useState<'CREATE' | 'ASSIGN' | 'NONE'>('NONE');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    taskName: '',
    description: '',
    taskType: 'MAINTENANCE',
    targetSlotId: ''
  });
  const [assignForm, setAssignForm] = useState({ staffId: '' });

  // Tải dữ liệu ban đầu
  // Tải dữ liệu ban đầu
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 🌟 GỌI THÊM taskApi.getAllTasks()
      const [servicesData, slotsData, locationsData, tasksData] = await Promise.all([
        managerApi.getServiceTypes().catch(() => []),
        managerApi.getSlots().catch(() => []),
        managerApi.getLocations().catch(() => []),
        taskApi.getAllTasks().catch(() => []) // Gọi API lấy Task
      ]);

      setServiceTypes(servicesData);
      setSlots(slotsData);
      setLocations(locationsData);

      // 🌟 MAP (CHUYỂN ĐỔI) DỮ LIỆU TỪ API ĐỂ KHỚP VỚI INTERFACE CỦA GIAO DIỆN
      const formattedTasks = tasksData.map((t: any) => ({
        id: t.id,
        name: t.taskName,              // API trả taskName -> UI cần name
        description: t.description,
        type: t.taskType,              // API trả taskType -> UI cần type
        status: t.status,
        slotId: t.targetSlotId,        // API trả targetSlotId -> UI cần slotId
        assigneeName: t.assignedStaffName // API trả assignedStaffName -> UI cần assigneeName
      }));

      setTasks(formattedTasks); 
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  // Hành động mở Modal
  const handleOpenCreateModal = () => {
    setCreateForm({ taskName: '', description: '', taskType: 'MAINTENANCE', targetSlotId: '' });
    setModalType('CREATE');
  };

  const handleOpenAssignModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedLocationId(''); // Reset bộ lọc location
    setAssignForm({ staffId: '' });
    setFilteredStaffs([]);
    setModalType('ASSIGN');
  };

  const handleCloseModal = () => {
    setModalType('NONE');
    setSelectedTask(null);
  };

  // 👉 HÀM 1: CHỈ XỬ LÝ TẠO TASK MỚI
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.taskName || !createForm.targetSlotId) {
      alert("Vui lòng nhập đầy đủ Tên công việc và chọn Ô vườn!");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        taskName: createForm.taskName,
        description: createForm.description,
        taskType: createForm.taskType,
        targetSlotId: Number(createForm.targetSlotId)
      };
      await taskApi.createTask(payload);
      alert('Tạo công việc thành công! Task đang ở trạng thái chờ phân công.');
      handleCloseModal();
      fetchData(); 
    } catch (error) {
      console.error('Lỗi tạo task:', error);
      alert('Tạo công việc thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 👉 HÀM 2: CHỈ XỬ LÝ GÁN TASK CHO NHÂN VIÊN
// 👉 HÀM 2: CHỈ XỬ LÝ GÁN TASK CHO NHÂN VIÊN
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.staffId || !selectedTask) {
      alert("Vui lòng chọn Nhân viên thực hiện!");
      return;
    }
    setIsSubmitting(true);
    try {
      const taskId = selectedTask.id;
      const staffId = Number(assignForm.staffId);
      
      // 🌟 KIỂM TRA LOG Ở CONSOLE TRÌNH DUYỆT
      console.log(`🚀 Đang gửi Request gán việc: POST /api/tasks/${taskId}/assign/${staffId}`);

      await taskApi.assignTask(taskId, staffId);
      alert('Giao việc thành công!');
      handleCloseModal();
      fetchData(); 
    } catch (error: any) {
      console.error('Lỗi giao việc:', error);
      
      // Bắt lỗi chi tiết từ Backend trả về để dễ debug
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Giao việc thất bại (Mã lỗi: ${error.response?.status}). Lý do: ${errorMsg}`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Công việc">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm tên công việc..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm outline-none transition" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleOpenCreateModal} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition text-sm shadow-sm shadow-green-600/20"
          >
            <Plus className="w-4 h-4" /> 
            Tạo công việc mới
          </button>
        </div>

        {/* Bảng Danh sách Task */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Danh sách công việc & Nhân viên phụ trách</h2>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Tên công việc</th>
                <th className="p-4 font-semibold text-gray-600">Loại</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600">Người thực hiện</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : filteredTasks.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có công việc nào.</td></tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500 font-mono">#{task.id}</td>
                    <td className="p-4 text-gray-900 font-medium">{task.name}</td>
                    <td className="p-4 text-gray-600">{task.type}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.status || 'Chưa gán'}
                      </span>
                    </td>
                    <td className="p-4">
                      {task.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                            {task.assigneeName.charAt(0)}
                          </div>
                          <span className="text-gray-700 font-medium">{task.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {/* Chỉ hiện nút Gán nhân viên khi task đang PENDING và chưa có người làm */}
                      {task.status === 'PENDING' && !task.assigneeName && (
                        <button
                          onClick={() => handleOpenAssignModal(task)}
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-green-50 hover:text-green-600 hover:border-green-200 text-gray-700 px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          <UserPlus className="w-4 h-4" /> Gán nhân viên
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================
            MODAL 1: TẠO CÔNG VIỆC MỚI
        ========================================= */}
        {modalType === 'CREATE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900">Tạo công việc mới</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                  <input required className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 outline-none" 
                    value={createForm.taskName} onChange={e => setCreateForm({...createForm, taskName: e.target.value})} placeholder="VD: Nhổ cỏ & bón phân khu A" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Mô tả chi tiết</label>
                  <textarea className="w-full border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 p-2.5 outline-none" 
                    rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Ghi chú thêm..." />
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-1.5">
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
              
              {/* Tóm tắt task */}
              <div className="bg-green-50/60 border border-green-100 p-4 rounded-xl mb-5">
                <p className="font-semibold text-gray-900 text-base">{selectedTask.name}</p>
                <div className="flex gap-4 mt-2 text-xs font-medium text-green-700 bg-white inline-flex px-3 py-1.5 rounded-lg border border-green-200">
                  <span>Loại: {selectedTask.type}</span>
                  <span className="w-px bg-green-200"></span>
                  <span>Slot ID: #{selectedTask.slotId}</span>
                </div>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-green-600" />
                    <span>Lọc và chọn nhân sự</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">1. Chọn Cơ sở / Chi nhánh</label>
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

      </div>
    </DashboardLayout>
  );
}