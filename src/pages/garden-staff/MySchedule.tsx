import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffScheduleApi, StaffSchedule } from '../../api/staffScheduleApi';
import { ClipboardList, Wifi, ShieldAlert, CheckCircle, History } from 'lucide-react';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <CalendarIcon className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> }
];

export default function MySchedule() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // The backend needs to know whose schedule to fetch.
      // Assuming getSchedules() uses the authenticated user context 
      // or we just fetch it if the endpoint supports it.
      const data = await staffScheduleApi.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Danh sách lịch trực của tôi</h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-green-600" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Không có lịch trực nào</p>
              <p className="text-sm mt-1">Bạn chưa được phân công lịch trực nào trong thời gian tới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                  <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-800 font-semibold">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{new Date(schedule.scheduleDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</span>
                    </div>
                    {schedule.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Ghi chú: </span>
                        {schedule.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
