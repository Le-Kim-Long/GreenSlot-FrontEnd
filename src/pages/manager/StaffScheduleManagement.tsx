import { useState, useEffect } from 'react';
import { staffScheduleApi, StaffSchedule } from '../../api/staffScheduleApi';
import { Calendar, Plus, Edit2, Trash2, X, Search, Clock, MapPin, User } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

const emptyForm: Partial<StaffSchedule> = {
  staffId: 1,
  staffName: '',
  locationId: 1,
  locationName: '',
  scheduleDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '17:00',
  notes: '',
  isActive: true,
};

export default function StaffScheduleManagement() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffSchedule | null>(null);
  const [formData, setFormData] = useState<Partial<StaffSchedule>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xóa State
  const [confirmDelete, setConfirmDelete] = useState<StaffSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (dateFilter) {
        data = await staffScheduleApi.getSchedulesByDate(dateFilter);
      } else {
        data = await staffScheduleApi.getSchedules();
      }
      setSchedules(data || []);
    } catch (err) {
      setError('Không thể tải danh sách lịch làm việc.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StaffSchedule) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.scheduleDate) {
      alert('Vui lòng chọn ngày trực!');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(formData.scheduleDate);
    if (isNaN(chosenDate.getTime()) || chosenDate < today) {
      alert('Ngày trực không hợp lệ: Không được chọn ngày trong quá khứ.');
      return;
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      alert('Thời gian trực không hợp lệ: Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await staffScheduleApi.updateSchedule(editingItem.id, formData);
      } else {
        await staffScheduleApi.createSchedule(formData);
      }
      alert(editingItem ? 'Cập nhật lịch làm việc thành công!' : 'Phân ca thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Thao tác thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await staffScheduleApi.deleteSchedule(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      alert('Xóa lịch làm việc thất bại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchedules = schedules.filter(s => 
    s.staffName?.toLowerCase().includes(search.toLowerCase()) ||
    s.locationName?.toLowerCase().includes(search.toLowerCase()) ||
    s.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Lịch làm việc & Phân ca Nhân viên">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Thanh công cụ lọc & tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[260px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm theo tên nhân viên, khu vực..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm outline-none" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>

            {/* Lọc theo ngày */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-green-600" />
              <input 
                type="date" 
                className="text-sm outline-none text-gray-700 bg-transparent"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-xs text-red-500 hover:underline ml-1">Xóa lọc</button>
              )}
            </div>
          </div>

          <button 
            onClick={handleOpenCreate} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm shadow-green-600/20 transition text-sm"
          >
            <Plus className="w-4 h-4" /> 
            Phân ca mới
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm border border-red-100">{error}</div>}

        {/* Bảng dữ liệu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nhân viên</th>
                <th className="p-4 font-semibold text-gray-600">Khu vực làm việc</th>
                <th className="p-4 font-semibold text-gray-600">Ngày & Giờ trực</th>
                <th className="p-4 font-semibold text-gray-600">Ghi chú</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải danh sách lịch trực...</td></tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không tìm thấy lịch phân ca nào.</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <User className="w-4 h-4 text-green-600" />
                        {schedule.staffName || `ID: ${schedule.staffId}`}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {schedule.locationName || `Khu vực #${schedule.locationId}`}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{schedule.scheduleDate}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 italic text-xs max-w-xs truncate">
                      {schedule.notes || 'Không có ghi chú'}
                    </td>
                    <td className="p-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold', schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {schedule.isActive ? 'Đang hoạt động' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(schedule)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition" title="Sửa lịch">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(schedule)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa lịch">
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

        {/* Modal Thêm / Sửa Lịch Trực */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                {editingItem ? 'Cập nhật lịch phân ca' : 'Phân ca trực mới'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Mã nhân viên (Staff ID)</label>
                    <input 
                      type="number" required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.staffId || ''}
                      onChange={e => setFormData({...formData, staffId: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Tên nhân viên</label>
                    <input 
                      required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.staffName || ''}
                      onChange={e => setFormData({...formData, staffName: e.target.value})}
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Mã khu vực (Location ID)</label>
                    <input 
                      type="number" required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.locationId || ''}
                      onChange={e => setFormData({...formData, locationId: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Tên khu vực</label>
                    <input 
                      required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.locationName || ''}
                      onChange={e => setFormData({...formData, locationName: e.target.value})}
                      placeholder="VD: Vườn Quận 7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Ngày trực</label>
                  <input 
                    type="date" required
                    min={new Date().toLocaleDateString('en-CA')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                    value={formData.scheduleDate || ''}
                    onChange={e => setFormData({...formData, scheduleDate: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                    <input 
                      type="time" required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.startTime || ''}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                    <input 
                      type="time" required
                      className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                      value={formData.endTime || ''}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Ghi chú ca trực</label>
                  <textarea 
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-green-500/20"
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="VD: Trực chăm sóc hệ thống tưới tự động..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" id="isActive"
                    className="w-4 h-4 text-green-600 rounded border-gray-300"
                    checked={formData.isActive ?? true}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <label htmlFor="isActive" className="font-medium text-gray-800 cursor-pointer select-none">
                    Kích hoạt ca trực này
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition shadow-sm">
                    {isSubmitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Phân ca'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Xóa */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Xóa lịch phân ca?</h3>
              <p className="text-sm text-gray-500 mb-6">Bạn có chắc muốn xóa lịch trực của nhân viên <span className="font-semibold text-gray-900">{confirmDelete.staffName}</span> vào ngày {confirmDelete.scheduleDate}?</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition">
                  {isDeleting ? 'Đang xóa...' : 'Xóa ngay'}
                </button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition">Hủy</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}