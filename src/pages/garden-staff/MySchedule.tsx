import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { staffScheduleApi, StaffSchedule } from '../../api/staffScheduleApi';
import { ClipboardList, Wifi, ShieldAlert, CheckCircle, History, Camera } from 'lucide-react';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <CalendarIcon className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> }
];

export default function MySchedule() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const totalPages = Math.ceil(schedules.length / pageSize) || 1;
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return schedules.slice(start, start + pageSize);
  }, [schedules, currentPage, pageSize]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await staffScheduleApi.getMySchedules();
      const sorted = (data || []).sort((a: StaffSchedule, b: StaffSchedule) => {
        const timeA = new Date(a.scheduleDate || 0).getTime();
        const timeB = new Date(b.scheduleDate || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return b.id - a.id;
      });
      setSchedules(sorted);
    } catch (err: any) {
      console.error('Error fetching my schedules:', err);
      setError('Không thể tải lịch trực. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="Lịch Trực Cá Nhân">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-emerald-200" />
              Lịch Trực & Ca Làm Việc Của Tôi
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Theo dõi lịch phân công ca trực cá nhân tại cơ sở vườn. Vui lòng có mặt đúng giờ để đảm bảo chất lượng vận hành.
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20">
            <span className="text-xs text-emerald-200 block uppercase font-medium">Tổng số ca trực</span>
            <span className="text-2xl font-black">{schedules.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-800 text-base">Danh sách ca trực được phân công</h2>
            </div>
            <span className="text-xs text-gray-500 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200/60">
              Lịch cá nhân
            </span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-600" />
              <p className="font-medium text-gray-600">Đang tải lịch trực cá nhân...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
          ) : schedules.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-bold text-gray-800">Không có lịch trực nào</p>
              <p className="text-sm text-gray-500 mt-1">Bạn chưa có ca trực nào được phân công trong thời gian tới.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {paginatedSchedules.map((schedule) => (
                  <div key={schedule.id} className="bg-white rounded-2xl shadow-sm border border-emerald-100/80 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3.5 border-b border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                          <CalendarIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{new Date(schedule.scheduleDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <span className="text-xs bg-emerald-600 text-white font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                          Đang áp dụng
                        </span>
                      </div>

                      <div className="p-5 space-y-3.5">
                        <div className="flex items-center gap-3 text-gray-800">
                          <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold text-base tracking-wide">{schedule.startTime?.substring(0, 5)} - {schedule.endTime?.substring(0, 5)}</span>
                        </div>

                        {schedule.locationName && (
                          <div className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <span className="font-semibold text-gray-700">🏢 Cơ sở:</span>
                            <span className="text-gray-900 font-medium">{schedule.locationName}</span>
                          </div>
                        )}

                        {schedule.slotNumber && (
                          <div className="text-xs text-emerald-800 flex items-center gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                            <span className="font-semibold text-emerald-900">🌱 Khu vực phụ trách:</span>
                            <span className="font-bold text-emerald-700">Ô vườn {schedule.slotNumber}</span>
                          </div>
                        )}

                        {schedule.notes && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                            <span className="font-bold block text-amber-950">📝 Ghi chú phân công:</span>
                            <p className="leading-relaxed">{schedule.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {schedules.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={schedules.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(sz) => {
                      setPageSize(sz);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[6, 12, 24]}
                    itemName="ca trực"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
