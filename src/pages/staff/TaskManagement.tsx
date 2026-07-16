import React, { useState, useEffect } from 'react';
import { taskApi } from '../../api/taskApi';
import { managerApi } from '../../api/managerApi';
import { ClipboardList, UserPlus, X, Plus, Search } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav'; 

// Khai báo Type
interface Task {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  slotId: number;
  assigneeName?: string;
}

interface Staff {
  id: number;
  name: string;
}

interface ServiceType {
  id: number;
  name: string;
  serviceName: string;
  description: string;
  price: number;
}

interface Slot {
  id: number;
  slotNumber?: string;
}

// ==========================================
// CHỈ MOCK DATA NHÂN VIÊN (STAFF)
// ==========================================
const MOCK_GARDENERS: Staff[] = [
  { id: 10, name: 'Nguyễn Văn A (Nhân viên vườn)' },
  { id: 11, name: 'Trần Thị B (Nhân viên vườn)' },
  { id: 12, name: 'Lê Văn C (Kỹ thuật viên)' },
];
// ==========================================

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]); // Để trống chờ API thật
  const [gardeners, setGardeners] = useState<Staff[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // States cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Các trường tự điền và dropdown
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    taskType: 'MAINTENANCE',
    targetSlotId: '',
    staffId: '',
    serviceId: '' // Tuỳ chọn theo UI
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, slotsData] = await Promise.all([
        managerApi.getServiceTypes().catch(() => []),
        managerApi.getSlots().catch(() => [])
        // Tương lai: Thêm API lấy toàn bộ Tasks ở đây
      ]);
      
      setServiceTypes(servicesData);
      setSlots(slotsData);
      setGardeners(MOCK_GARDENERS); // Fake nhân viên
      setTasks([]); // Chưa có API list toàn bộ task, tạm thời rỗng
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCreateModal = () => {
    setIsCreateMode(true);
    setSelectedTask(null);
    setFormData({ taskName: '', description: '', taskType: 'MAINTENANCE', targetSlotId: '', staffId: '', serviceId: '' });
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = (task: Task) => {
    setIsCreateMode(false);
    setSelectedTask(task);
    setFormData({ taskName: '', description: '', taskType: '', targetSlotId: '', staffId: '', serviceId: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId) {
      alert("Vui lòng chọn Nhân viên!");
      return;
    }
    if (isCreateMode && (!formData.taskName || !formData.targetSlotId)) {
      alert("Vui lòng nhập Tên công việc và chọn Ô vườn!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Payload được build CHUẨN 100% theo image_e7eb38.png
      const payload = {
        taskId: isCreateMode ? 0 : (selectedTask?.id || 0),
        staffId: Number(formData.staffId),
        taskName: isCreateMode ? formData.taskName : (selectedTask?.name || ""),
        description: isCreateMode ? formData.description : (selectedTask?.description || ""),
        taskType: isCreateMode ? formData.taskType : (selectedTask?.type || "MAINTENANCE"),
        targetSlotId: isCreateMode ? Number(formData.targetSlotId) : (selectedTask?.slotId || 0),
      };

      await taskApi.assignTask(payload);
      
      alert(isCreateMode ? 'Tạo và giao việc thành công!' : 'Giao việc thành công!');
      handleCloseModal();
      fetchData(); 
    } catch (error) {
      console.error('Lỗi khi giao việc:', error);
      alert('Thao tác thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Công việc">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm tên công việc..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleOpenCreateModal} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> 
            Tạo & Giao việc mới
          </button>
        </div>

        {/* Bảng Danh sách Task */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800">Danh sách các task & Nhân viên phụ trách</h2>
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
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chưa có công việc nào. (Chờ API List Task)</td></tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500">#{task.id}</td>
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
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {task.status === 'PENDING' && !task.assigneeName && (
                        <button
                          onClick={() => handleOpenAssignModal(task)}
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 hover:text-green-600 text-gray-700 px-3 py-1.5 rounded-lg transition"
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

        {/* Modal Form Mới */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5">
                {isCreateMode ? 'Tạo và Giao việc mới' : 'Giao việc cho nhân viên'}
              </h2>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                
                {/* NHÓM: TỰ ĐIỀN */}
                {isCreateMode && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border" 
                        value={formData.taskName}
                        onChange={e => setFormData({...formData, taskName: e.target.value})}
                        placeholder="VD: Nhổ cỏ khu vực B"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết</label>
                      <textarea 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border" 
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Ghi chú thêm cho nhân viên..."
                      />
                    </div>
                  </>
                )}

                {/* NHÓM: DROP BARS */}
                {isCreateMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại công việc</label>
                      <select 
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border bg-white"
                        value={formData.taskType}
                        onChange={e => setFormData({...formData, taskType: e.target.value})}
                      >
                        <option value="MAINTENANCE">Bảo trì / Chăm sóc</option>
                        <option value="CLEANING">Dọn dẹp</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Ô vườn (Slot) <span className="text-red-500">*</span></label>
                      <select 
                        required
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border bg-white"
                        value={formData.targetSlotId}
                        onChange={e => setFormData({...formData, targetSlotId: e.target.value})}
                      >
                        <option value="" disabled>-- Chọn ô --</option>
                        {slots.map(s => <option key={s.id} value={s.id}>Ô {s.slotNumber || `#${s.id}`}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <hr className="border-gray-100 my-2" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nhân viên phụ trách (Staff) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border bg-white"
                  >
                    <option value="" disabled>-- Chọn nhân viên --</option>
                    {gardeners.map((staff) => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dịch vụ đính kèm (Services)</label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-green-500 p-2.5 border bg-white"
                  >
                    <option value="">-- Không đính kèm dịch vụ --</option>
                    {serviceTypes.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.serviceName || svc.name} ({svc.price.toLocaleString('vi-VN')} đ)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">* Lưu ý: Dịch vụ chỉ để ghi chú trong UI, không gửi kèm API Assign.</p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition">
                    Hủy
                  </button>
                  <button type="submit" disabled={isSubmitting || !formData.staffId} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50">
                    {isSubmitting ? 'Đang xử lý...' : isCreateMode ? 'Tạo & Giao việc' : 'Xác nhận giao việc'}
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